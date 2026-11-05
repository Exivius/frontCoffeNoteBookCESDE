# US06 — Panel de administración

Entrada independiente: `admin-login.html`. El login de clientes y sus páginas mantienen su comportamiento. El panel sigue la paleta y tipografía del frontend existente, con navegación lateral en escritorio y desplazable en móvil. No incluye cuentas de demostración ni listas simuladas.

## Ejecutar

Desde la raíz del frontend:

```sh
python3 -m http.server 5500
```

Abrir `http://localhost:5500/admin-login.html`. Para operar con datos reales se necesita un servicio que implemente el contrato indicado y acepte solicitudes desde el origen del frontend. Esta historia solo modifica el frontend; no implementa ni cambia el backend. No abrir mediante `file://`, porque los módulos JavaScript necesitan un servidor HTTP.

La dirección inicial es `http://localhost:8080/api`. Se puede cambiar desde **Configurar conexión** en el login. La dirección se guarda en `localStorage` bajo `coffeeAdminApiUrl`. Al cambiarla se elimina la sesión local anterior. No se incluyen contraseñas ni credenciales en la URL.

## Sesión

- `POST /api/admin/session`, cuerpo `{ "email": "...", "password": "..." }`.
- Respuesta `{ "token": "...", "admin": { "id": 42, "name": "...", "email": "..." } }`.
- Token y datos básicos del administrador se guardan en `sessionStorage`, separados de la sesión de clientes; la contraseña nunca se guarda.
- Todas las consultas y mutaciones envían `Authorization: Bearer <token>`.
- Una respuesta `401` elimina la sesión y vuelve al acceso. El servidor debe validar autenticación y autorización en cada petición; el control de pantalla no sustituye esa validación.
- `DELETE /api/admin/session` invalida la sesión en el servidor. Si la red falla durante el cierre, se limpia la sesión local y se informa que la remota no pudo confirmarse.

## Recursos y contrato acordado

Todas las rutas siguientes son relativas a `/api/admin`. Los listados responden con un array JSON directo. Se usan `POST /recurso` para crear, `PUT /recurso/{id}` para actualizar y `DELETE /recurso/{id}` para eliminar. La creación acepta `201`; las mutaciones también aceptan respuestas `204` sin cuerpo. Los IDs los asigna el servidor y viajan en la URL al editar o eliminar.

| Recurso | Campos del formulario | Identificador |
| --- | --- | --- |
| `users` | name, lastName, email, phone, password, state, city | id |
| `admins` | name, lastName, email, phone, password, state, area | id |
| `places` | placeName, placeType | placeId |
| `products` | productName, productPrice, productType | productId |
| `payment-methods` | methodName | methodId |

Los listados de personas y la respuesta de sesión **no deben devolver contraseñas**. Al editar una cuenta, dejar la contraseña vacía omite ese campo del `PUT`, y el servidor conserva la actual. `state` admite `Activo` e `Inactivo`. `productPrice` se envía como número. Las restricciones de relaciones y unicidad se aplican en el servidor; los errores `409` se muestran al usuario. El contrato requiere que el servidor proteja la eliminación del administrador con sesión activa o del último administrador; esta protección no puede implementarse solo desde el frontend.

`GET /orders` y `GET /payments` tienen acceso de consulta. Se acordó no ofrecer mutaciones de transacciones desde este panel:

- Orden: `orderId`, `userId`, `placeId`, `items` y `total`. Cada item incluye `productId`, `quantity` y puede incluir el producto para presentar su nombre.
- Pago: `paymentId`, `paymentType`, `orderId`, `methodId`, `amount` y `userId`.

También se admiten relaciones anidadas `user`, `place`, `shoppingCart`, `order` y `paymentMethod` para mostrar datos existentes de Java. No se agregan columnas al esquema MySQL.

## Estados de pantalla

Se distinguen carga, sección vacía, búsqueda sin coincidencias, fallo de conexión, sesión expirada y error de operación. Las listas fallidas se mantienen vacías y ofrecen **Actualizar**; no se muestra éxito ante un error de la API. Las acciones de edición impiden envíos duplicados y requieren confirmar la eliminación. Los datos del servidor se insertan mediante `textContent`, sin ejecutar HTML recibido.

Las solicitudes vencen tras diez segundos. El servidor debe permitir CORS para el origen configurado, los métodos `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`, y los encabezados `Authorization` y `Content-Type`. En despliegue HTTPS, la API también debe usar HTTPS.

## Verificación

Pruebas del cliente HTTP y los contratos de formulario, sin dependencias adicionales:

```sh
node --test tests/admin-api.test.mjs
```

Se comprobó además con Chromium automatizado: acceso protegido, login, encabezado Bearer, listado y búsqueda, CRUD de sedes, consulta de pagos sin mutaciones, logout, login sin servicio y adaptación a escritorio de 1440 px y móvil de 390 px. Estas comprobaciones usaron respuestas REST controladas; la prueba con el servicio y MySQL reales depende de que estén disponibles.

## Ajustes del contrato previsto

El alcance inicial incluía CRUD para todos los recursos. Se precisó el contrato previsto para que **órdenes y pagos solo se consulten**, conservar contraseñas omitidas en `PUT`, derivar el importe del pago en los listados y proteger la eliminación de cuentas administrativas activas. El frontend refleja ese contrato. Su implementación en el backend queda fuera de esta historia y no se da por disponible.
