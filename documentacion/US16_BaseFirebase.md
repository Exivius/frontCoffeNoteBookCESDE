# Datos compartidos en Firebase

El frontend es independiente y usa Firebase Authentication para el acceso y Cloud Firestore para los datos. La web pública está en https://notebook-coffee-1793855157.web.app/.

## Qué se guarda

- `users`: perfil, sede y rol; las contraseñas las administra Authentication.
- `usernames`: reserva de nombres de usuario.
- `products`, `places`, `paymentMethods`: catálogos gestionados desde administración.
- `carts`: carrito de cada cuenta, compartido al volver a entrar desde otro dispositivo.
- `orders`: productos y precios de la compra, sede, método de pago y respuestas del chat.

La copia de productos y pedidos en localStorage solo sirve para dibujar las vistas. La sesión real y las reglas de Firestore determinan qué datos puede consultar o modificar cada persona. Las cuentas creadas en la versión anterior únicamente local no se importan automáticamente: se registran una vez en Firebase.

El registro vuelve al login con credenciales de una sola lectura en sessionStorage, que se descartan al rellenar el formulario. El registro no inicia una sesión de compra automáticamente.

## Compras y recogida

La compra se registra en una transacción: comprueba el inventario actual y los precios de Firestore, descuenta existencias, registra la orden y limpia el carrito. Si falla, conserva el carrito y muestra el error. Cada pedido admite hasta nueve productos distintos para respetar los límites de lectura de las reglas.

El pago de tarjeta/Nequi conserva internamente su carácter académico; no existe una pasarela bancaria ni cobros reales. Contra entrega queda pendiente al recoger.

Las respuestas se agregan al historial del pedido mediante una transacción. Al enviar se cierra el chat y vuelve al resumen. Otro dispositivo, con la misma cuenta, puede consultar el pedido y su historial.

El QR comparte nombre, sede, productos/cantidades y método de pago para abrir la galería sin iniciar sesión. No incluye correo, contraseña ni token; su contenido es una vista informativa, no una validación bancaria.

## Administración

Desde el login se accede mediante «Acceso de administración». Solo perfiles con rol `Admin` y estado `Activo` pueden gestionar catálogos y cuentas o consultar todos los pedidos. Cambiar el rol en el navegador no otorga acceso.

La cuenta inicial se prepara con `scripts/configurar-firebase.py`. Sus credenciales se guardan fuera del repositorio en `~/.config/notebook-coffee/administrador.json`, con permisos privados. Para cambiar su contraseña se puede usar el acceso de clientes y «Mis datos personales».

El administrador crea usuarios y otros administradores sin perder su propia sesión. Las cuentas se desactivan para impedir su acceso y conservar el historial. Cada persona cambia su contraseña en su perfil; el correo de acceso se mantiene.

## Publicación

1. Autenticarse con `gcloud auth login` en una cuenta autorizada del proyecto.
2. Ejecutar `python3 scripts/configurar-firebase.py` para configurar dominios, datos iniciales, administrador y reglas. Los registros existentes se conservan.
3. Ejecutar `python3 scripts/publicar-firebase.py --deploy` para publicar los archivos estáticos.

`firebase-config.js` contiene la configuración pública del cliente, no credenciales administrativas. Los tokens de gcloud se usan solo en memoria en los scripts. El paquete público excluye `.git`, documentación, credenciales, pruebas, reglas y scripts administrativos.

## Validación realizada

- Registro y login reales, sin contraseñas en los perfiles Firestore.
- Compra con inventario transaccional y consulta desde dos sesiones independientes.
- Respuestas de ambos dispositivos conservadas en el chat.
- Acceso admin y creación/edición/eliminación de catálogos; creación y desactivación de cuentas.
- Rechazo de lectura de perfiles/carritos ajenos, cambios de rol, lectura global de pedidos por clientes y manipulación de inventario/importes.
- QR público con imágenes, cantidades, dueño, sede y método de pago.
- Pantallas móviles, eliminación visible y footer compacto.
