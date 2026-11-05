import qrcode from './vendor/qrcode-generator.mjs';
import { PUBLIC_SITE_URL } from './publicacion.js';

const imagenes = { breakfast: './images/breakfast.png', lunch: './images/lunch.png', dinner: './images/dinner.png' };

function mensajePago(pedido) {
  if (pedido.metodo === 'contra entrega') return 'Pago contra entrega · pendiente al recoger.';
  if (/nequi/i.test(pedido.metodo)) return 'Pago con Nequi · simulación confirmada, sin cobro real.';
  if (/tarjeta/i.test(pedido.metodo)) return 'Pago con tarjeta · simulación confirmada, sin cobro real.';
  return `Método de pago: ${pedido.metodo || 'No disponible'}.`;
}

// El QR lleva el detalle visual de la compra, sin datos personales ni sesión.
export function mostrarQrRecogida(orden) {
  const pedido = {
    metodo: orden.metodoDePago || '',
    productos: (orden.listaDeProductos || []).map(item => ({
      id: String(item.producto.identificacion).toLowerCase(),
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
    })),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(pedido));
  const datos = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
  const destino = new URL('./recogida.html', PUBLIC_SITE_URL);
  destino.searchParams.set('pedido', datos);
  const enlace = document.querySelector('#pickupGalleryLink');
  enlace.href = destino.href;
  const contenedor = document.querySelector('#orderQr');
  contenedor.replaceChildren();
  try {
    const qr = qrcode(0, 'M');
    qr.addData(destino.href);
    qr.make();
    const acceso = document.createElement('a');
    acceso.className = 'pickup-qr-link';
    acceso.href = destino.href;
    acceso.target = '_blank';
    acceso.rel = 'noopener noreferrer';
    acceso.setAttribute('aria-label', 'Abrir imágenes, cantidades y método de pago del pedido');
    // SVG producido únicamente por la librería QR; no contiene HTML del pedido.
    acceso.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 20, scalable: true });
    contenedor.append(acceso);
  } catch {
    contenedor.textContent = 'Este pedido es demasiado extenso para el QR. Puedes abrir sus imágenes con el enlace.';
  }
}

const galeria = document.querySelector('#pickupProducts');
if (galeria) {
  try {
    const datos = new URLSearchParams(location.search).get('pedido');
    if (!datos || datos.length > 20000) throw new Error('El enlace del pedido no es válido.');
    const bytes = Uint8Array.from(atob(datos), character => character.charCodeAt(0));
    const pedido = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof pedido.metodo !== 'string' || !Array.isArray(pedido.productos)
        || !pedido.productos.length || pedido.productos.length > 50) throw new Error('El pedido no contiene productos válidos.');
    const tarjetas = [];
    let unidades = 0;
    for (const producto of pedido.productos) {
      if (typeof producto.id !== 'string' || typeof producto.nombre !== 'string'
          || producto.nombre.length > 150 || !Number.isInteger(producto.cantidad)
          || producto.cantidad < 1 || producto.cantidad > 10000) throw new Error('El detalle de productos no es válido.');
      const tarjeta = document.createElement('article');
      tarjeta.className = 'pickup-product';
      const imagen = Object.hasOwn(imagenes, producto.id) ? imagenes[producto.id] : null;
      if (imagen) {
        const foto = document.createElement('img');
        foto.src = imagen;
        foto.alt = producto.nombre;
        tarjeta.append(foto);
      }
      const titulo = document.createElement('h2');
      titulo.textContent = producto.nombre;
      const cantidad = document.createElement('p');
      cantidad.className = 'pickup-quantity';
      cantidad.textContent = `Cantidad para recoger: ${producto.cantidad}`;
      tarjeta.append(titulo, cantidad);
      tarjetas.push(tarjeta);
      unidades += producto.cantidad;
    }
    galeria.replaceChildren(...tarjetas);
    document.querySelector('#pickupPayment').textContent = mensajePago(pedido);
    document.querySelector('#pickupUnits').textContent = `${unidades} unidades en ${tarjetas.length} productos.`;
  } catch (error) {
    document.querySelector('#pickupPayment').textContent = error.message || 'No se pudo abrir el pedido.';
  }
}
