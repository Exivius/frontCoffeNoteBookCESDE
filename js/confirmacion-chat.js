import { saveConfirmation, cloudError } from './cloud.js';
// Conversación del pedido persistida en Firebase; no conecta con WhatsApp.
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

  function mostrarConfirmacion(confirmacion, historial) {
    if (!confirmacion) return;
    const hora = new Date(confirmacion.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
    const mensajes = Array.isArray(historial) && historial.length ? historial : [confirmacion];
    const burbujas = mensajes.map(mensaje => {
      const burbuja = document.createElement('div');
      burbuja.className = 'chat-bubble chat-bubble--reply';
      const texto = document.createElement('p');
      const recogida = new Date(mensaje.fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
      texto.textContent = `Confirmo que recogeré el pedido el ${recogida}. ${mensaje.mensaje || ''}`;
      const envio = document.createElement('small');
      envio.className = 'chat-time';
      envio.textContent = mensaje.confirmadaEn
        ? `Enviado el ${new Date(mensaje.confirmadaEn).toLocaleString('es-CO')}` : 'Confirmación anterior';
      burbuja.append(texto, envio);
      return burbuja;
    });
    document.querySelector('#chatReplies').replaceChildren(...burbujas);
    document.querySelector('#pickupConfirmation').textContent = `Hora de recogida confirmada: ${hora}`;
    fecha.value = fechaLocal(new Date(confirmacion.fecha));
    respuesta.value = confirmacion.mensaje || '';
  }
  mostrarConfirmacion(orden.confirmacionRecogida, orden.historialChat);

  formulario.onsubmit = async event => {
    event.preventDefault();
    estado.textContent = '';
    fecha.min = fechaLocal(new Date());
    if (!formulario.reportValidity()) return;
    const seleccion = new Date(fecha.value);
    if (!Number.isFinite(seleccion.getTime()) || seleccion.getTime() < Date.now() - 60000) {
      estado.textContent = 'Selecciona una hora de recogida que no haya pasado.';
      return;
    }
    const boton = formulario.querySelector('button[type="submit"]');
    if (boton.disabled) return;
    boton.disabled = true;
    try {
      const sesion = JSON.parse(sessionStorage.getItem('usuarioActual') || 'null');
      if (sesion?.id !== usuario.id) throw new Error('Tu sesión cambió. Inicia sesión de nuevo.');
      const confirmacion = { id: crypto.randomUUID(), fecha: seleccion.toISOString(), mensaje: respuesta.value.trim(), confirmadaEn: new Date().toISOString() };
      const actual = await saveConfirmation(orden.ordenId, confirmacion);
      mostrarConfirmacion(actual.confirmacionRecogida, actual.historialChat);
      estado.textContent = 'Respuesta enviada. Tu hora de recogida quedó confirmada.';
      clearTimeout(aperturaPendiente);
      ventana.close();
      const confirmacionWeb = document.querySelector('#pickupConfirmation');
      confirmacionWeb.tabIndex = -1;
      confirmacionWeb.focus();
    } catch (error) { estado.textContent = cloudError(error); }
    finally { boton.disabled = false; }
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
