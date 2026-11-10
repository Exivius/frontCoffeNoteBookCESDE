// Adapta las acciones del panel a las funciones de autenticación y Firestore.
import { login, logout, auth, adminRecords, adminWrite, cloudError } from './cloud.js';

export const DEFAULT_API_URL = 'Firebase';
export const SESSION_KEY = 'coffeeAdminSession';
export const API_URL_KEY = 'coffeeAdminApiUrl';
export const getApiUrl = () => DEFAULT_API_URL;
export const normalizeApiUrl = () => DEFAULT_API_URL;
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export class AdminApi {
  async request(path, { method = 'GET', body } = {}) {
    try {
      if (path === '/session' && method === 'POST') {
        const user = await login(body.identifier || body.email, body.password, true);
        return { token: user.id, admin: { id: user.id, name: user.nombre, email: user.correo } };
      }
      if (path === '/session' && method === 'DELETE') { await logout(); return null; }
      const [, resource, encodedId] = path.split('/');
      if (method === 'GET') return await adminRecords(resource);
      await adminWrite(resource, method, encodedId ? decodeURIComponent(encodedId) : null, body || {});
      return null;
    } catch (error) {
      throw new ApiError(cloudError(error), error.code === 'permission-denied' ? 403 : auth.currentUser ? 400 : 401);
    }
  }
}

export function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return value?.token && value.admin && value.apiUrl === DEFAULT_API_URL ? value : null;
  } catch { return null; }
}
export function showNotice(element, message, kind = 'error') {
  element.textContent = message;
  element.dataset.kind = kind;
  element.hidden = !message;
}
