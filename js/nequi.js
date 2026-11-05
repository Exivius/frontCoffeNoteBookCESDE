// Flujo académico local: no solicita datos bancarios ni utiliza APIs de Nequi.
export function configurarSimulacionNequi(obtenerCarrito, formatoMoneda) {
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
      ? 'Simular solicitud Nequi' : 'Reintentar simulación';
  }

  solicitar.addEventListener('click', () => {
    const carrito = obtenerCarrito();
    const total = carrito.calcularTotal();
    resumenAprobado = '';
    const itemsInvalidos = carrito.listaDeProductos.some(item =>
      !Number.isInteger(item.cantidad) || item.cantidad < 1 ||
      !Number.isFinite(Number(item.producto.precio)) || Number(item.producto.precio) <= 0);
    if (!carrito.listaDeProductos.length || itemsInvalidos || !Number.isFinite(total) || total <= 0) {
      mostrarEstado('rechazada', 'Agrega productos con un total válido antes de simular.');
      return;
    }
    totalVisible.textContent = formatoMoneda.format(total);
    resumenAprobado = resumenActual();
    mostrarEstado('pendiente', 'Solicitud de prueba creada. Elige un resultado para continuar; no se ha enviado ningún cobro.');
  });

  document.querySelector('#nequiApprove').addEventListener('click', () => {
    if (estado !== 'pendiente') return;
    if (resumenAprobado !== resumenActual()) {
      mostrarEstado('cancelada', 'El carrito cambió. Crea una nueva solicitud de prueba.');
      return;
    }
    referencia = `SIM-NEQUI-${Date.now()}`;
    mostrarEstado('aprobada', 'Simulación aprobada. Regresando a tu compra…');
    ventana.close();
    document.querySelector('#paymentForm').requestSubmit();
  });

  document.querySelector('#nequiReject').addEventListener('click', () => {
    if (estado !== 'pendiente') return;
    resumenAprobado = '';
    mostrarEstado('rechazada', 'Simulación rechazada. Tu carrito se conserva; puedes reintentar o elegir otro método.');
  });

  document.querySelector('#nequiCancel').addEventListener('click', () => {
    if (estado !== 'pendiente') return;
    resumenAprobado = '';
    mostrarEstado('cancelada', 'Simulación cancelada. No se creó un pedido ni se modificó tu carrito.');
    ventana.close();
  });

  return {
    cambiarMetodo(metodo) {
      if (ventana.open) ventana.close();
      panel.hidden = metodo !== 'nequi';
      resumenAprobado = '';
      referencia = '';
      totalVisible.textContent = formatoMoneda.format(obtenerCarrito().calcularTotal());
      mostrarEstado('inicial', 'Listo para crear una solicitud de prueba.');
    },
    validar() {
      if (estado !== 'aprobada') {
        return 'Completa la simulación Nequi y elige «Simular aprobación» antes de confirmar el pedido.';
      }
      if (resumenAprobado !== resumenActual()) {
        mostrarEstado('cancelada', 'El carrito cambió. Crea una nueva solicitud de prueba.');
        return 'El carrito cambió después de la simulación. Revisa el total y vuelve a simular.';
      }
      return '';
    },
    comprobante() {
      return { proveedor: 'Nequi', simulado: true, estado: 'aprobada', referencia };
    },
  };
}
