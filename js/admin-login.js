import { AdminApi, API_URL_KEY, SESSION_KEY, getApiUrl, normalizeApiUrl, readSession, showNotice } from "./admin-api.js";

const form = document.querySelector("#adminLoginForm");
const notice = document.querySelector("#loginNotice");
const submit = document.querySelector("#loginSubmit");
submit.disabled = false;

if (readSession()) window.location.replace("admin.html");
const reason = new URLSearchParams(window.location.search).get("reason");
if (reason === "expired") showNotice(notice, "Tu sesión terminó. Ingresa de nuevo para continuar.");
if (reason === "logout") showNotice(notice, "Sesión cerrada correctamente.", "success");
if (reason === "local-logout") showNotice(notice, "Se cerró la sesión en este navegador. El servicio no respondió al cierre; la sesión del servidor expirará según su configuración.");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  submit.disabled = true;
  submit.textContent = "Ingresando…";
  showNotice(notice, "");
  try {
    const apiUrl = getApiUrl();
    const data = await new AdminApi(apiUrl).request("/session", { method: "POST", body: {
      identifier: form.elements.identifier.value.trim(), password: form.elements.password.value,
    } });
    if (typeof data?.token !== "string" || !data.token || !data.admin?.id || !data.admin?.email) {
      throw new Error("El servicio no devolvió una sesión de administrador válida.");
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token, admin: data.admin, apiUrl }));
    form.elements.password.value = "";
    window.location.replace("admin.html");
  } catch (error) {
    showNotice(notice, error.status === 401 ? "Correo o contraseña incorrectos, o cuenta inactiva." : error.message);
  } finally {
    submit.disabled = false;
    submit.textContent = "Ingresar al panel →";
  }
});
