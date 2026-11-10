// Flujo académico local: no solicita datos bancarios ni utiliza APIs de Nequi.
export function configurarSimulacionNequi(obtenerCarrito, formatoMoneda) {
  // Flujo visual para practicar el checkout: valida el importe, pero nunca consulta ni cobra una cuenta Nequi.
  const panel = document.querySelector('#nequiDemo');
  const estadoVisible = document.querySelector('#nequiStatus');
  const acciones = document.querySelector('#nequiActions');
  const solicitar = document.querySelector('#nequiRequest');
  const totalVisible = document.querySelector('#nequiTotal');
  const ventana = document.querySelector('#nequiWindow');
  document.querySelector('#openNequi').addEventListener('click', () => {
    solicitar.click();
    ventana.showModal();
  });
  document.querySelector('#closeNequi').addEventListener('click', () => ventana.close());
  let estado = 'inicial';
  let resumenAprobado = '';
  let referencia = '';

  // La aprobación solo sirve para los productos, cantidades e importe revisados.
  const resumenActual = () => {
    const carrito = obtenerCarrito();
    return JSON.stringify({
      productos: carrito.listaDeProductos,
      total: carrito.calcularTotal(),
    });
  };

  function mostrarEstado(nuevoEstado, mensaje) {
    estado = nuevoEstado;
    estadoVisible.dataset.state = estado;
    estadoVisible.textContent = mensaje;
    acciones.hidden = estado !== 'pendiente';
    solicitar.hidden = estado === 'pendiente' || estado === 'aprobada';
    solicitar.textContent = estado === 'inicial'
      ? 'Solicitar pago' : 'Reintentar pago';
  }

  solicitar.addEventListener('click', () => {
    const carrito = obtenerCarrito();
    const total = carrito.calcularTotal();
    resumenAprobado = '';
    const itemsInvalidos = carrito.listaDeProductos.some(item =>
      !Number.isInteger(item.cantidad) || item.cantidad < 1 ||
      !Number.isFinite(Number(item.producto.precio)) || Number(item.producto.precio) <= 0);
    if (!carrito.listaDeProductos.length || itemsInvalidos || !Number.isFinite(total) || total <= 0) {
      mostrarEstado('rechazada', 'Agrega productos con un total válido antes de pagar.');
      return;
    }
    totalVisible.textContent = formatoMoneda.format(total);
    resumenAprobado = resumenActual();
    mostrarEstado('pendiente', 'Solicitud lista. Revisa el total y confirma para continuar.');
  });

  document.querySelector('#nequiApprove').addEventListener('click', () => {
    if (estado !== 'pendiente') return;
    if (resumenAprobado !== resumenActual()) {
      mostrarEstado('cancelada', 'El carrito cambió. Solicita el pago de nuevo.');
      return;
    }
    referencia = `SIM-NEQUI-${Date.now()}`;
    mostrarEstado('aprobada', 'Pago aprobado. Regresando a tu compra…');
    ventana.close();
    document.querySelector('#paymentForm').requestSubmit();
  });

  document.querySelector('#nequiReject').addEventListener('click', () => {
    if (estado !== 'pendiente') return;
    resumenAprobado = '';
    mostrarEstado('rechazada', 'Pago rechazado. Tu carrito se conserva; puedes reintentar o elegir otro método.');
  });

  document.querySelector('#nequiCancel').addEventListener('click', () => {
    if (estado !== 'pendiente') return;
    resumenAprobado = '';
    mostrarEstado('cancelada', 'Pago cancelado. No se creó un pedido ni se modificó tu carrito.');
    ventana.close();
  });

  return {
    cambiarMetodo(metodo) {
      if (ventana.open) ventana.close();
      panel.hidden = metodo !== 'nequi';
      resumenAprobado = '';
      referencia = '';
      totalVisible.textContent = formatoMoneda.format(obtenerCarrito().calcularTotal());
      mostrarEstado('inicial', 'Listo para solicitar el pago.');
    },
    validar() {
      if (estado !== 'aprobada') {
        return 'Abre Nequi y elige «Aprobar pago» antes de confirmar el pedido.';
      }
      if (resumenAprobado !== resumenActual()) {
        mostrarEstado('cancelada', 'El carrito cambió. Solicita el pago de nuevo.');
        return 'El carrito cambió. Revisa el total y solicita el pago de nuevo.';
      }
      return '';
    },
    comprobante() {
      return { proveedor: 'Nequi', simulado: true, estado: 'aprobada', referencia };
    },
  };
}
