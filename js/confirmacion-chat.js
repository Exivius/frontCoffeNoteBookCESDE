// Conversación local de demostración; no conecta con WhatsApp.
export function configurarChatRecogida(orden, usuario) {
  const ventana = document.querySelector('#orderChatWindow');
  const formulario = document.querySelector('#pickupReplyForm');
  const fecha = document.querySelector('#pickupTime');
  const respuesta = document.querySelector('#pickupReply');
  const estado = document.querySelector('#chatReplyStatus');
  const clave = `chatMostrado_${usuario.id}_${orden.ordenId}`;
  let aperturaPendiente;
  const abrir = () => {
    clearTimeout(aperturaPendiente);
    if (!ventana.open) ventana.showModal();
    sessionStorage.setItem(clave, '1');
  };
  document.querySelector('#openOrderChat').onclick = abrir;
  document.querySelector('#closeOrderChat').onclick = () => ventana.close();

  const fechaLocal = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  fecha.min = fechaLocal(new Date());
  fecha.value = fechaLocal(new Date(Math.max(Date.now() + 20 * 60000, new Date(orden.dia).getTime() + 20 * 60000)));

  function mostrarConfirmacion(confirmacion) {
    if (!confirmacion) return;
    const hora = new Date(confirmacion.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    const burbuja = document.createElement('div');
    burbuja.className = 'chat-bubble chat-bubble--reply';
    burbuja.textContent = `Confirmo que recogeré el pedido el ${hora}. ${confirmacion.mensaje || ''}`;
    document.querySelector('#chatReplies').replaceChildren(burbuja);
    document.querySelector('#pickupConfirmation').textContent = `Hora de recogida confirmada: ${hora}`;
    fecha.value = fechaLocal(new Date(confirmacion.fecha));
    respuesta.value = confirmacion.mensaje || '';
  }
  mostrarConfirmacion(orden.confirmacionRecogida);

  formulario.onsubmit = event => {
    event.preventDefault();
    estado.textContent = '';
    fecha.min = fechaLocal(new Date());
    if (!formulario.reportValidity()) return;
    const seleccion = new Date(fecha.value);
    if (!Number.isFinite(seleccion.getTime()) || seleccion.getTime() < Date.now() - 60000) {
      estado.textContent = 'Selecciona una hora de recogida que no haya pasado.';
      return;
    }
    try {
      const sesion = JSON.parse(sessionStorage.getItem('usuarioActual') || 'null');
      if (sesion?.id !== usuario.id) throw new Error('Tu sesión cambió. Inicia sesión de nuevo.');
      const ordenes = JSON.parse(localStorage.getItem('ordenes') || '[]');
      const actual = ordenes.find(item => item.ordenId === orden.ordenId && item.clienteId === usuario.id);
      if (!actual) throw new Error('No se encontró esta compra en tu historial.');
      actual.confirmacionRecogida = { fecha: seleccion.toISOString(), mensaje: respuesta.value.trim(), confirmadaEn: new Date().toISOString() };
      localStorage.setItem('ordenes', JSON.stringify(ordenes));
      mostrarConfirmacion(actual.confirmacionRecogida);
      estado.textContent = 'Respuesta guardada. Tu hora de recogida quedó confirmada en esta demostración.';
      clearTimeout(aperturaPendiente);
      ventana.close();
      const confirmacionWeb = document.querySelector('#pickupConfirmation');
      confirmacionWeb.tabIndex = -1;
      confirmacionWeb.focus();
    } catch (error) { estado.textContent = error.message || 'No se pudo guardar tu confirmación.'; }
  };

  // Una vez por compra: el resumen se ve antes de abrir la conversación.
  if (new URLSearchParams(location.search).get('compra') === '1' && !sessionStorage.getItem(clave)) {
    aperturaPendiente = setTimeout(() => {
      if (JSON.parse(sessionStorage.getItem('usuarioActual') || 'null')?.id !== usuario.id) return;
      abrir();
      sessionStorage.setItem(clave, '1');
    }, 3000);
  }
}
