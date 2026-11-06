# US07 — Pago Nequi simulado

La opción **Nequi · simulación** permite recorrer un checkout de demostración sin conectarse con Nequi ni solicitar celular, claves, PIN o códigos de autenticación.

## Flujo

1. Inicia sesión, agrega productos y abre `pago.html`.
2. Selecciona Nequi. Revisa el total y el aviso de demostración.
3. Pulsa **Simular solicitud Nequi**.
4. Elige **Simular aprobación**, **Simular rechazo** o **Cancelar simulación**.
5. Solo después de aprobar se permite **Confirmar pedido de demostración**.

Rechazar o cancelar conserva el carrito y permite reintentar. Cambiar de método reinicia la simulación. Si cambia el carrito después de aprobar, se requiere una nueva solicitud. El stock se comprueba otra vez al confirmar.

Al confirmar se usa el flujo local de órdenes existente: guarda la orden, descuenta el inventario de demostración y vacía el carrito. La orden conserva `simulacionPago`, una referencia `SIM-NEQUI-*`, el estado «demostración confirmada» y el método «Nequi (simulación, sin cobro)». El detalle también indica que no se movió dinero. No se guarda información bancaria.

## Comprobaciones

- Seleccionar tarjeta y luego Nequi oculta los campos de tarjeta y quita su obligatoriedad.
- Confirmar sin aprobar muestra un aviso y no crea una orden.
- Rechazar, cancelar y cambiar de método no crean órdenes ni modifican el stock.
- Aprobar y confirmar crea una única orden local identificada como simulación.
- Un cambio en el carrito invalida la aprobación; la falta de stock impide confirmar.
- Contra entrega y tarjeta mantienen su comportamiento.

Ejecuta un servidor estático desde la carpeta del proyecto (`python3 -m http.server 8000`) y abre `http://localhost:8000`. Esta historia solo implementa una demostración; una integración bancaria real requeriría otro alcance.
