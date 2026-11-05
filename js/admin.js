import { AdminApi, SESSION_KEY, readSession, showNotice } from "./admin-api.js";
import { resources, recordValue, formPayload } from "./admin-resources.js";

const session = readSession();
if (!session) window.location.replace("admin-login.html");
else initialize(session);

function initialize(session) {
  const $ = (selector) => document.querySelector(selector);
  const api = new AdminApi(session.apiUrl, session.token);
  const nav = $("#resourceNav");
  const notice = $("#pageNotice");
  const dialog = $("#editorDialog");
  const form = $("#editorForm");
  const saveButton = $("#saveButton");
  let current = resourceFromHash();
  let records = [];
  let loaded = false;
  let loadSequence = 0;
  let editing = null;
  let editingResource = current;
  let mutationBusy = false;
  let signingOut = false;

  $("#adminShell").hidden = false;
  $("#connectionStatus").title = `Servicio configurado: ${session.apiUrl}`;
  $("#adminName").textContent = session.admin.name || session.admin.email;
  for (const [key, config] of Object.entries(resources)) {
    const link = document.createElement("a");
    link.href = `#${key}`;
    link.className = "admin-nav-link";
    const icon = document.createElement("span");
    icon.className = "admin-nav-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = config.icon;
    link.append(icon, document.createTextNode(config.title));
    nav.append(link);
  }

  function resourceFromHash() {
    const key = window.location.hash.slice(1);
    return Object.hasOwn(resources, key) ? key : "places";
  }

  function handleError(error, element = notice) {
    if (error.status === 401) {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace("admin-login.html?reason=expired");
      return;
    }
    showNotice(element, error.message);
  }

  function empty(title, description) {
    $("#emptyTitle").textContent = title;
    $("#emptyDescription").textContent = description;
    $("#emptyState").hidden = false;
  }

  async function load() {
    const sequence = ++loadSequence;
    const resource = current;
    $("#connectionStatus").textContent = "Consultando servicio…";
    loaded = false;
    records = [];
    showNotice(notice, "");
    $("#recordsRegion").setAttribute("aria-busy", "true");
    $("#refreshButton").disabled = true;
    $("#createButton").disabled = true;
    $("#recordsBody").replaceChildren();
    $("#resultCount").textContent = "";
    empty("Cargando registros…", "Estamos consultando la información de la cafetería.");
    try {
      const result = await api.request(`/${resource}`);
      if (sequence !== loadSequence || signingOut) return;
      if (!Array.isArray(result)) throw new Error("El servicio devolvió un listado inesperado. Intenta actualizar la sección.");
      records = result.filter((record) => record && typeof record === "object");
      loaded = true;
      $("#connectionStatus").textContent = "Datos del servicio actualizados";
      render();
    } catch (error) {
      if (sequence !== loadSequence || signingOut) return;
      handleError(error);
      $("#connectionStatus").textContent = "Servicio no disponible";
      empty("No pudimos cargar esta sección", "Comprueba la conexión con el servicio y pulsa Actualizar para intentar de nuevo.");
    } finally {
      if (sequence === loadSequence) {
        $("#recordsRegion").setAttribute("aria-busy", "false");
        $("#refreshButton").disabled = false;
        $("#createButton").disabled = !loaded;
      }
    }
  }

  function selectResource() {
    current = resourceFromHash();
    const config = resources[current];
    document.title = `${config.title} | Coffee-NoteBook CESDE`;
    $("#resourceTitle").textContent = config.title;
    $("#resourceDescription").textContent = config.description;
    $("#tableCaption").textContent = `Listado de ${config.title.toLowerCase()}`;
    $("#resourceSearch").value = "";
    $("#createButton").hidden = Boolean(config.readOnly);
    $("#createButton").textContent = `+ Crear ${config.singular}`;
    $("#readOnlyNote").hidden = !config.readOnly;
    for (const link of nav.children) {
      if (link.hash === `#${current}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    const row = document.createElement("tr");
    for (const [, label] of config.columns) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      row.append(cell);
    }
    if (!config.readOnly) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = "Acciones";
      row.append(cell);
    }
    $("#recordsHead").replaceChildren(row);
    load();
  }

  function formatValue(value, key) {
    if (value === undefined || value === null || value === "") return "—";
    if (["productPrice", "amount", "total"].includes(key) && Number.isFinite(Number(value))) {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 2 }).format(Number(value));
    }
    if (key === "items" && Array.isArray(value)) {
      return value.map((item) => `${item.product?.productName || `Producto ${item.productId ?? item.product?.productId ?? ""}`} × ${item.quantity}`).join(" · ") || "Sin productos";
    }
    return typeof value === "object" ? "—" : String(value);
  }

  function render() {
    const config = resources[current];
    const search = $("#resourceSearch").value.trim().toLocaleLowerCase("es");
    const filtered = records.filter((record) => config.columns.some(([key]) => formatValue(recordValue(record, key), key).toLocaleLowerCase("es").includes(search)));
    $("#recordsBody").replaceChildren();
    $("#resultCount").textContent = `${filtered.length} de ${records.length} registros`;
    $("#emptyState").hidden = filtered.length > 0;
    if (!filtered.length) empty(search ? "No encontramos coincidencias" : "Todavía no hay registros", search ? "Prueba con otro nombre o identificador." : config.readOnly ? "Las transacciones aparecerán cuando estén registradas en el servicio." : `Crea tu primer registro de ${config.singular} para empezar.`);
    for (const record of filtered) {
      const row = document.createElement("tr");
      for (const [key] of config.columns) {
        const cell = document.createElement("td");
        cell.textContent = formatValue(recordValue(record, key), key);
        row.append(cell);
      }
      if (!config.readOnly) {
        const cell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "admin-row-actions";
        for (const [label, handler, style] of [["Editar", () => openEditor(record), "secondary"], ["Eliminar", () => deleteRecord(record), "danger"]]) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `button button--small button--${style}`;
          button.textContent = label;
          button.disabled = mutationBusy;
          button.setAttribute("aria-label", `${label} ${config.singular} ${record[config.id]}`);
          button.addEventListener("click", handler);
          actions.append(button);
        }
        cell.append(actions);
        row.append(cell);
      }
      $("#recordsBody").append(row);
    }
  }

  function openEditor(record = null) {
    if (mutationBusy || resources[current].readOnly || !loaded) return;
    editing = record;
    editingResource = current;
    const config = resources[current];
    $("#editorTitle").textContent = `${record ? "Editar" : "Crear"} ${config.singular}`;
    $("#editorFields").replaceChildren();
    showNotice($("#editorNotice"), "");
    for (const item of config.fields) {
      const group = document.createElement("div");
      group.className = "field-group";
      const label = document.createElement("label");
      label.htmlFor = `editor-${item.key}`;
      label.textContent = item.label;
      const input = document.createElement(item.type === "select" ? "select" : "input");
      input.id = label.htmlFor;
      input.name = item.key;
      input.required = !item.optional && !(item.type === "password" && record);
      if (item.type === "select") {
        for (const value of item.values) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = value;
          input.append(option);
        }
      } else {
        input.type = item.type;
        if (item.max) input.maxLength = item.max;
        if (item.min !== undefined) input.min = item.min;
        if (item.step) input.step = item.step;
        if (item.placeholder) input.placeholder = item.placeholder;
        if (item.type === "password") input.autocomplete = "new-password";
      }
      if (record && item.type !== "password") input.value = record[item.key] ?? "";
      group.append(label, input);
      if (item.type === "password" && record) {
        const help = document.createElement("small");
        help.id = "passwordHelp";
        help.textContent = "Déjala vacía para conservar la contraseña actual.";
        input.setAttribute("aria-describedby", help.id);
        group.append(help);
      }
      $("#editorFields").append(group);
    }
    dialog.showModal();
  }

  function setEditorBusy(value) {
    mutationBusy = value;
    saveButton.disabled = value;
    saveButton.textContent = value ? "Guardando…" : "Guardar";
    $("#closeEditor").disabled = value;
    $("#cancelEditor").disabled = value;
    for (const field of $("#editorFields").querySelectorAll("input, select")) field.disabled = value;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (mutationBusy || !form.reportValidity()) return;
    const resource = editingResource;
    const config = resources[resource];
    const payload = formPayload(form, config, Boolean(editing));
    // Los campos de texto obligatorios deben contener más que espacios.
    for (const item of config.fields) {
      if (!item.optional && item.type !== "password" && payload[item.key] === "") {
        showNotice($("#editorNotice"), `Completa el campo ${item.label.toLowerCase()}.`);
        return;
      }
    }
    const id = editing?.[config.id];
    if (editing && (id === undefined || id === null)) {
      showNotice($("#editorNotice"), "No se pudo identificar el registro. Cierra el formulario y actualiza la sección.");
      return;
    }
    setEditorBusy(true);
    showNotice($("#editorNotice"), "");
    try {
      await api.request(`/${resource}${editing ? `/${encodeURIComponent(id)}` : ""}`, { method: editing ? "PUT" : "POST", body: payload });
      dialog.close();
      await load();
      if (loaded) showNotice(notice, "Los cambios se guardaron correctamente.", "success");
    } catch (error) { handleError(error, $("#editorNotice")); }
    finally { setEditorBusy(false); if (loaded) render(); }
  });

  async function deleteRecord(record) {
    if (mutationBusy || resources[current].readOnly) return;
    const config = resources[current];
    const id = record[config.id];
    if (id === undefined || id === null) { showNotice(notice, "El registro no tiene un identificador válido."); return; }
    if (!window.confirm(`¿Eliminar ${config.singular} #${id}? Esta acción no se puede deshacer.`)) return;
    mutationBusy = true;
    $("#createButton").disabled = true;
    render();
    const resource = current;
    try {
      await api.request(`/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (current === resource) {
        await load();
        if (loaded) showNotice(notice, "Registro eliminado correctamente.", "success");
      }
    } catch (error) { if (current === resource) handleError(error); }
    finally { mutationBusy = false; $("#createButton").disabled = !loaded; if (loaded) render(); }
  }

  $("#logoutButton").addEventListener("click", async () => {
    if (signingOut) return;
    signingOut = true;
    $("#logoutButton").disabled = true;
    let reason = "logout";
    try { await api.request("/session", { method: "DELETE" }); }
    catch (error) { if (error.status !== 401) reason = "local-logout"; }
    finally {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace(`admin-login.html?reason=${reason}`);
    }
  });
  $("#refreshButton").addEventListener("click", load);
  $("#resourceSearch").addEventListener("input", () => { if (loaded) render(); });
  $("#createButton").addEventListener("click", () => openEditor());
  $("#closeEditor").addEventListener("click", () => dialog.close());
  $("#cancelEditor").addEventListener("click", () => dialog.close());
  dialog.addEventListener("cancel", (event) => { if (mutationBusy) event.preventDefault(); });
  window.addEventListener("hashchange", () => {
    if (dialog.open && !mutationBusy) dialog.close();
    selectResource();
  });
  selectResource();
}
