# Panel conectado al backend Java

El panel administrativo usa la API HTTP del proyecto `notebookCoffeeCESDE`; no consulta Firebase para las operaciones de administración. El resto de las páginas de clientes conserva la integración Firebase independiente.

## Ejecución local

1. Configura `NOTEBOOK_DB_URL`, `NOTEBOOK_DB_USER` y `NOTEBOOK_DB_PASSWORD` para la base MySQL local del backend y aplica las migraciones listadas en la guía `US27_BackendRestAdmin.md`.
2. Inicia `scripts/run-api.sh` en el repositorio Java. La API queda en `http://localhost:8080/api`.
3. Desde la raíz del frontend, inicia un servidor estático en `localhost:8780`, por ejemplo `python3 -m http.server 8780 --bind 127.0.0.1`.
4. Abre `http://localhost:8780/admin-login.html` e ingresa con una cuenta `ADMIN` activa de MySQL.

El API solo escucha en la interfaz de loopback y acepta el origen local configurado. No expone MySQL ni una clave administrativa al navegador. Las sesiones Bearer vencen a las ocho horas y se invalidan al cerrar sesión o reiniciar el servicio.

## Datos del panel

Usuarios, administradores, sedes, productos, órdenes, pagos y métodos se consultan por medio de los servicios Java. Sedes, productos, personas, órdenes, pagos y métodos usan las tablas MySQL correspondientes. La edición de órdenes y pagos sigue siendo de solo lectura.

El flujo visual Nequi/WhatsApp del frontend continúa separado del cobro financiero; no procesa dinero real. Para que la aplicación pública use la API en un teléfono, el backend necesitaría una dirección HTTPS alcanzable desde Internet. Esta rama configura la integración para ejecución local en el equipo.
