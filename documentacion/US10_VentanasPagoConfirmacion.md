# Ventanas de pago y confirmación de recogida

El flujo se ejecuta íntegramente en el frontend mediante ventanas modales. No requiere permisos de ventanas emergentes ni abre servicios bancarios o WhatsApp reales.

1. Elegir Nequi y pulsar «Abrir Nequi de demostración».
2. Aprobar, rechazar o cancelar la transacción simulada. Rechazar y cancelar conservan el carrito. Aprobar valida carrito y stock antes de guardar una sola compra y regresar al resumen.
3. Tres segundos después de confirmar la compra, se abre la conversación de recogida. La apertura automática ocurre una vez por compra y sesión; el botón permite reabrirla.
4. Elegir fecha/hora y escribir una respuesta. La confirmación queda asociada a la orden del usuario en localStorage y se recupera al consultar esa compra. Las horas pasadas no se aceptan.

Validación en Chromium: cancelación/rechazo sin compras, aprobación con retorno, apertura diferida del chat, persistencia de hora y respuesta tras recargar, ausencia de errores JavaScript y diseño móvil de 390 px. La revisión usa datos locales de prueba. El backend no se modifica.
