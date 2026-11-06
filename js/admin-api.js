export const DEFAULT_API_URL = 'http://localhost:8080/api';
export const SESSION_KEY = 'coffeeAdminSession';
export const API_URL_KEY = 'coffeeAdminApiUrl';
export const getApiUrl = () => DEFAULT_API_URL;
export const normalizeApiUrl = () => DEFAULT_API_URL;
export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export class AdminApi {
  constructor(baseUrl = DEFAULT_API_URL, token = null) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  async request(path, { method = 'GET', body } = {}) {
    try {
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (this.token) headers.Authorization = `Bearer ${this.token}`;
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const result = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new ApiError(result?.message || `El backend respondió con estado ${response.status}.`, response.status);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(`No se pudo conectar con el backend Java en ${this.baseUrl}. Inicia el servicio y vuelve a intentar.`, 0);
    }
  }
}

export function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return value?.token && value.admin && typeof value.apiUrl === 'string' ? value : null;
  } catch { return null; }
}
export function showNotice(element, message, kind = 'error') {
  element.textContent = message;
  element.dataset.kind = kind;
  element.hidden = !message;
}
