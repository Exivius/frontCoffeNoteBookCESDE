# Panel administrativo

Acceso público: https://notebook-coffee-1793855157.web.app/admin-login.html.

El panel usa Firebase Authentication y Firestore. Su configuración y validación se describen en [US16_BaseFirebase.md](US16_BaseFirebase.md). El acceso «Administración» está disponible desde el login de clientes.

Secciones: usuarios, administradores, sedes, productos con inventario, órdenes, pagos y métodos de pago. Los pedidos y pagos son de consulta. Las cuentas se desactivan conservando su historial.

Los roles y permisos se verifican mediante reglas Firestore; la sesión guardada por la interfaz no concede privilegios. Los errores de conexión y de permisos se muestran sin simular resultados exitosos.
