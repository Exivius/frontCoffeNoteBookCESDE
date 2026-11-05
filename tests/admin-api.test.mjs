import test from 'node:test';
import assert from 'node:assert/strict';
import { AdminApi, ApiError, normalizeApiUrl } from '../js/admin-api.js';
import { resources, formPayload } from '../js/admin-resources.js';

const response = (data, status = 200) => new Response(status === 204 ? null : JSON.stringify(data), { status });

test('configuración admite HTTP/HTTPS sin enviar credenciales en la URL', () => {
  assert.equal(normalizeApiUrl('http://localhost:8080/api/'), 'http://localhost:8080/api');
  for (const url of ['file:///tmp/api', 'javascript:alert(1)', 'http://user:secret@example.test/api', 'https://example.test/api?x=1']) assert.throws(() => normalizeApiUrl(url));
});

test('autenticación usa contrato REST sin token y no guarda credenciales', async () => {
  let request;
  const api = new AdminApi('http://localhost:8080/api', null, async (url, options) => {
    request = { url, options };
    return response({ token: 'session', admin: { id: 4, name: 'Ana', email: 'ana@example.test' } });
  });
  await api.request('/session', { method: 'POST', body: { email: 'ana@example.test', password: 'secret' } });
  assert.equal(request.url, 'http://localhost:8080/api/admin/session');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(request.options.body), { email: 'ana@example.test', password: 'secret' });
  assert.equal(request.options.cache, 'no-store');
});

test('CRUD envía Bearer y acepta respuestas sin contenido', async () => {
  const requests = [];
  const api = new AdminApi('http://localhost:8080/api', 'session', async (url, options) => {
    requests.push({ url, options });
    return response(null, 204);
  });
  assert.equal(await api.request('/places/12', { method: 'PUT', body: { placeName: 'Bello', placeType: 'Punto de Entrega' } }), null);
  await api.request('/session', { method: 'DELETE' });
  assert.equal(requests[0].options.headers.Authorization, 'Bearer session');
  assert.equal(requests[0].options.method, 'PUT');
  assert.equal(requests[1].options.method, 'DELETE');
  assert.equal(requests[1].options.body, undefined);
});

test('sesión expirada, relaciones y fallo de conexión se distinguen sin fingir éxito', async () => {
  for (const status of [401, 403, 409, 500]) {
    const api = new AdminApi('http://localhost:8080/api', 'token', async () => response({ message: 'server details' }, status));
    await assert.rejects(api.request('/users'), (error) => error instanceof ApiError && error.status === status && !error.message.includes('server details'));
  }
  const unavailable = new AdminApi('http://localhost:8080/api', null, async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(unavailable.request('/session'), /No se pudo conectar/);
});

test('respuesta HTML inesperada no se presenta como registros válidos', async () => {
  const api = new AdminApi('http://localhost:8080/api', null, async () => new Response('<html>Not API</html>'));
  await assert.rejects(api.request('/users'), /respuesta inesperada/);
});

test('edición de personas omite contraseña vacía y convierte precios a número', () => {
  const config = resources.users;
  const elements = Object.fromEntries(config.fields.map((field) => [field.key, { value: field.key === 'password' ? '' : ' dato ' }]));
  const edit = formPayload({ elements }, config, true);
  assert.equal(Object.hasOwn(edit, 'password'), false);
  assert.equal(edit.name, 'dato');
  assert.equal(formPayload({ elements }, config, false).password, '');
  const product = formPayload({ elements: { productName: { value: ' Café ' }, productPrice: { value: '4500.50' }, productType: { value: 'Bebida' } } }, resources.products, false);
  assert.equal(product.productPrice, 4500.5);
  assert.equal(resources.payments.readOnly, true);
  assert.equal(resources.orders.readOnly, true);
});
