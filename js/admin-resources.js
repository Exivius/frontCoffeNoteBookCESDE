const field = (key, label, type = "text", options = {}) => ({ key, label, type, ...options });
const personFields = [field("name", "Nombre", "text", { max: 100 }), field("lastName", "Apellido", "text", { optional: true, max: 100 }),
  field("email", "Correo electrónico", "email", { max: 150 }), field("phone", "Teléfono", "tel", { optional: true, max: 20 }),
  field("password", "Contraseña", "password", { max: 255 }), field("state", "Estado", "select", { values: ["Activo", "Inactivo"] })];
const personColumns = [["id", "ID"], ["name", "Nombre"], ["lastName", "Apellido"], ["email", "Correo"], ["state", "Estado"]];
export const resources = {
  users: { deactivate: true, title: "Usuarios", singular: "usuario", icon: "♙", description: "Las personas que le dan vida a la cafetería.", id: "id", fields: [...personFields, field("city", "Ciudad", "text", { optional: true, max: 100 })], columns: personColumns },
  admins: { deactivate: true, title: "Administradores", singular: "administrador", icon: "◇", description: "Organiza las cuentas de tu equipo.", id: "id", fields: [...personFields, field("area", "Área", "text", { optional: true, max: 100 })], columns: [...personColumns, ["area", "Área"]] },
  places: { title: "Sedes", singular: "sede", icon: "⌂", description: "Cada punto de encuentro, en un solo lugar.", id: "placeId", fields: [field("placeName", "Nombre de la sede", "text", { max: 100 }), field("placeType", "Tipo de sede", "text", { max: 100, placeholder: "Punto de Venta o Punto de Entrega" })], columns: [["placeId", "ID"], ["placeName", "Nombre"], ["placeType", "Tipo"]] },
  products: { title: "Productos", singular: "producto", icon: "☕", description: "Mantén al día los favoritos del menú.", id: "productId", fields: [field("productName", "Nombre", "text", { max: 150 }), field("productPrice", "Precio (COP)", "number", { min: 0.01, step: "0.01" }), field("productType", "Tipo", "select", { values: ["Desayuno", "Almuerzo", "Cena"] }), field("stock", "Unidades disponibles", "number", { min: 0, step: "1" }), field("description", "Descripción", "text", { max: 500 })], columns: [["productId", "ID"], ["productName", "Nombre"], ["productPrice", "Precio"], ["productType", "Tipo"], ["stock", "Disponibles"]] },
  orders: { title: "Órdenes", singular: "orden", icon: "▤", description: "Consulta las órdenes registradas en la cafetería.", id: "orderId", readOnly: true, columns: [["orderId", "ID"], ["userId", "Usuario"], ["placeId", "Sede"], ["items", "Productos"], ["total", "Total"]] },
  payments: { title: "Pagos", singular: "pago", icon: "$", description: "Consulta las transacciones y sus métodos de pago.", id: "paymentId", readOnly: true, columns: [["paymentId", "ID"], ["paymentType", "Tipo"], ["orderId", "Orden"], ["methodId", "Método"], ["amount", "Total"]] },
  "payment-methods": { title: "Métodos de pago", singular: "método de pago", icon: "▱", description: "Ofrece a tus clientes distintas formas de pagar.", id: "methodId", fields: [field("methodName", "Nombre del método", "text", { max: 100 })], columns: [["methodId", "ID"], ["methodName", "Nombre"]] },
};

export function recordValue(record, key) {
  if (record[key] !== undefined && record[key] !== null) return record[key];
  if (key === "userId") return record.user?.id;
  if (key === "placeId") return record.place?.placeId;
  if (key === "orderId") return record.order?.orderId;
  if (key === "methodId") return record.paymentMethod?.methodId;
  if (key === "items") return record.shoppingCart?.items;
  if (key === "total") return record.shoppingCart?.total;
  return undefined;
}

export function formPayload(form, config, editing) {
  const payload = {};
  for (const item of config.fields) {
    const raw = form.elements[item.key].value;
    if (item.type === "password" && editing && raw === "") continue;
    payload[item.key] = item.type === "number" ? Number(raw) : item.type === "password" ? raw : raw.trim();
  }
  return payload;
}
