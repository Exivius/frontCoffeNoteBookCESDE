"""Prepara el frontend estático; --deploy publica usando la sesión de gcloud."""
import argparse
import concurrent.futures
import gzip
import hashlib
import json
import pathlib
import shutil
import subprocess
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--deploy', action='store_true')
    args = parser.parse_args()
    # El SITE_ID de firebase.json decide a cuál de los sitios del mismo proyecto
    # se publica; .firebaserc conserva el ID de proyecto y sus recursos Firebase.
    config = json.loads((ROOT / 'firebase.json').read_text())['hosting']
    project = json.loads((ROOT / '.firebaserc').read_text())['projects']['default']
    site = config['site']
    output = ROOT / '.hosting' / 'public'
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    sources = list(ROOT.glob('*.html'))
    for folder in ['css', 'js', 'images']:
        sources.extend((ROOT / folder).rglob('*'))
    assets = {}
    for source in sources:
        if source.is_symlink() or not source.is_file():
            continue
        if source.suffix not in ['.html', '.css', '.js', '.mjs', '.png', '.jpg', '.jpeg', '.svg', '.txt']:
            continue
        relative = source.relative_to(ROOT)
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        assets['/' + relative.as_posix()] = gzip.compress(source.read_bytes(), mtime=0)
    print(f'Frontend preparado: {len(assets)} archivos públicos.', flush=True)
    if not args.deploy:
        return

    # La credencial solo vive en memoria; no se escribe en el proyecto ni en logs.
    token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
    api = 'https://firebasehosting.googleapis.com/v1beta1/'

    def request(url, method='GET', data=None, binary=False):
        payload = data if binary else None if data is None else json.dumps(data).encode()
        req = urllib.request.Request(url, data=payload, method=method, headers={
            'Authorization': 'Bearer ' + token,
            'x-goog-user-project': project,
            'Content-Type': 'application/octet-stream' if binary else 'application/json',
        })
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                raw = response.read()
                return None if binary or not raw else json.loads(raw)
        except urllib.error.HTTPError as error:
            try:
                message = json.load(error)['error']['message']
            except (ValueError, KeyError):
                message = error.reason
            raise RuntimeError(f'Firebase HTTP {error.code}: {message}') from None

    headers = [{'glob': item['source'], 'headers': {h['key']: h['value'] for h in item['headers']}}
               for item in config.get('headers', [])]
    version = request(api + f'sites/{site}/versions', 'POST', {'config': {'headers': headers}})
    name = version['name']
    (ROOT / '.hosting' / 'version.json').write_text(json.dumps({'name': name, 'status': version['status']}))
    print('Versión creada:', name, flush=True)
    uploads = {hashlib.sha256(content).hexdigest(): content for content in assets.values()}
    files = {path: hashlib.sha256(content).hexdigest() for path, content in assets.items()}
    population = request(api + name + ':populateFiles', 'POST', {'files': files})
    def upload(digest):
        request(population['uploadUrl'] + '/' + digest, 'POST', uploads[digest], binary=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        list(executor.map(upload, population.get('uploadRequiredHashes', [])))
    finalized = request(api + name + '?update_mask=status', 'PATCH', {'status': 'FINALIZED'})
    if finalized['status'] != 'FINALIZED':
        raise RuntimeError('La versión todavía no está lista para publicar.')
    release = request(api + f'sites/{site}/releases?versionName={name}', 'POST', {
        'message': 'Frontend Notebook Coffee CESDE: pago, recogida y QR público',
    })
    (ROOT / '.hosting' / 'release.json').write_text(json.dumps(release, indent=2))
    print('Publicación:', release['name'])
    print(f'Web pública: https://{site}.web.app/')


if __name__ == '__main__':
    main()
