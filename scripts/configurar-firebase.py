"""Configura reglas, datos iniciales y primer administrador con la sesión de gcloud."""
import json
import os
import pathlib
import secrets
import subprocess
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROJECT = json.loads((ROOT / '.firebaserc').read_text())['projects']['default']
TOKEN = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()


def request(url, method='GET', data=None):
    req = urllib.request.Request(url, method=method, data=None if data is None else json.dumps(data).encode(), headers={
        'Authorization': 'Bearer ' + TOKEN, 'x-goog-user-project': PROJECT, 'Content-Type': 'application/json',
    })
    try:
        with urllib.request.urlopen(req, timeout=40) as response:
            content = response.read()
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as error:
        detail = json.load(error).get('error', {})
        raise RuntimeError(f"HTTP {error.code}: {detail.get('message', error.reason)}") from None


def value(data):
    if data is None: return {'nullValue': None}
    if isinstance(data, bool): return {'booleanValue': data}
    if isinstance(data, int): return {'integerValue': str(data)}
    if isinstance(data, float): return {'doubleValue': data}
    if isinstance(data, str): return {'stringValue': data}
    if isinstance(data, list): return {'arrayValue': {'values': [value(item) for item in data]}}
    return {'mapValue': {'fields': {key: value(item) for key, item in data.items()}}}


documents = f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/'
auth_config = f'https://identitytoolkit.googleapis.com/admin/v2/projects/{PROJECT}/config'
configuration = request(auth_config)
domains = list(dict.fromkeys(configuration.get('authorizedDomains', []) + ['localhost', '127.0.0.1', 'notebook-coffee-1793855157.web.app', 'notebook-coffee-1793855157.firebaseapp.com']))
request(auth_config + '?updateMask=authorizedDomains', 'PATCH', {'authorizedDomains': domains})
if not configuration.get('signIn', {}).get('email', {}).get('enabled'):
    raise RuntimeError('Activa Correo/contraseña en Firebase Authentication antes de continuar.')

seed = json.loads((ROOT / 'database' / 'seed.json').read_text())
for entity, records in seed.items():
    for record in records:
        identifier = record.get('identificacion') or record.get('placeId') or record.get('methodId')
        path = entity + '/' + identifier
        try:
            request(documents + path)
        except RuntimeError as error:
            if 'HTTP 404' not in str(error): raise
            request(documents + path, 'PATCH', {'fields': {key: value(item) for key, item in record.items()}})
print('Catálogo, sedes y métodos preparados; se conservaron los registros existentes.', flush=True)

credentials_file = pathlib.Path.home() / '.config' / 'notebook-coffee' / 'administrador.json'
email = 'admin@notebookcoffee.example'
accounts = f'https://identitytoolkit.googleapis.com/v1/projects/{PROJECT}/accounts'
lookup = request(accounts + ':lookup', 'POST', {'email': [email]})
if lookup.get('users'):
    uid = lookup['users'][0]['localId']
else:
    password = secrets.token_urlsafe(24)
    created = request(accounts, 'POST', {'email': email, 'password': password, 'displayName': 'Administración Notebook Coffee', 'emailVerified': True})
    uid = created['localId']
    credentials_file.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(credentials_file, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(descriptor, 'w') as stream:
        json.dump({'email': email, 'password': password, 'url': 'https://notebook-coffee-1793855157.web.app/admin-login.html'}, stream, indent=2)
    print('Credenciales iniciales guardadas fuera del repositorio:', credentials_file, flush=True)
try:
    request(documents + 'users/' + uid)
except RuntimeError as error:
    if 'HTTP 404' not in str(error): raise
    user = {'id': uid, 'nombre': 'Administración Notebook Coffee', 'correo': email, 'nombreDeUsuario': uid,
            'direccion': 'Centro', 'rol': 'Admin', 'state': 'Activo', 'area': 'Administración'}
    request(documents + 'users/' + uid, 'PATCH', {'fields': {key: value(item) for key, item in user.items()}})
    request(documents + 'usernames/' + uid, 'PATCH', {'fields': {'uid': value(uid)}})

base = 'https://firebaserules.googleapis.com/v1/projects/' + PROJECT
ruleset = request(base + '/rulesets', 'POST', {'source': {'files': [{'name': 'firestore.rules', 'content': (ROOT / 'firestore.rules').read_text()}]}})
release_name = 'projects/' + PROJECT + '/releases/cloud.firestore'
try:
    request('https://firebaserules.googleapis.com/v1/' + release_name)
    request('https://firebaserules.googleapis.com/v1/' + release_name, 'PATCH', {'release': {'name': release_name, 'rulesetName': ruleset['name']}})
except RuntimeError as error:
    if 'HTTP 404' not in str(error): raise
    request(base + '/releases', 'POST', {'name': release_name, 'rulesetName': ruleset['name']})
print('Reglas Firestore publicadas:', ruleset['name'])
print('Administrador preparado:', email)
