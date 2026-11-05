export const DEFAULT_API_URL = "http://localhost:8080/api";
export const SESSION_KEY = "coffeeAdminSession";
export const API_URL_KEY = "coffeeAdminApiUrl";

export function normalizeApiUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error("Usa una dirección HTTP o HTTPS sin credenciales, parámetros ni fragmentos.");
  }
  return url.href.replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export class AdminApi {
  constructor(baseUrl, token = null, fetcher = globalThis.fetch.bind(globalThis)) {
    this.baseUrl = normalizeApiUrl(baseUrl);
    this.token = token;
    this.fetcher = fetcher;
  }

  async request(path, { method = "GET", body } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const headers = { Accept: "application/json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    try {
      const response = await this.fetcher(`${this.baseUrl}/admin${path}`, {
        method, headers, signal: controller.signal, cache: "no-store",
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const raw = response.status === 204 ? "" : await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { /* El estado HTTP permite informar errores sin JSON. */ }
      if (!response.ok) {
        const message = response.status === 401 ? "La sesión no es válida o expiró. Ingresa de nuevo."
          : response.status === 403 ? "Tu cuenta no tiene permiso para realizar esta acción."
          : response.status === 409 ? "El registro está en uso o sus datos ya existen. Revisa la información."
          : response.status >= 500 ? "El servicio no pudo completar la operación. Intenta de nuevo."
          : typeof data?.message === "string" ? data.message : "No se pudo completar la operación.";
        throw new ApiError(message, response.status);
      }
      if (raw && data === null) throw new ApiError("El servicio devolvió una respuesta inesperada. Revisa la dirección configurada.");
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(error.name === "AbortError"
        ? "El servicio tardó demasiado en responder. Comprueba la conexión e intenta de nuevo."
        : "No se pudo conectar con el servicio de la cafetería. Comprueba que esté disponible y que la dirección sea correcta.");
    } finally { clearTimeout(timeout); }
  }
}

export function getApiUrl() {
  try { return normalizeApiUrl(localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL); }
  catch { return DEFAULT_API_URL; }
}

export function readSession() {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return typeof value?.token === "string" && value.token && value.admin && value.apiUrl === getApiUrl() ? value : null;
  } catch { return null; }
}

export function showNotice(element, message, kind = "error") {
  element.textContent = message;
  element.dataset.kind = kind;
  element.hidden = !message;
}
