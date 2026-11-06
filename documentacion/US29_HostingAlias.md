# Alias corto de Firebase Hosting

La aplicación conserva el proyecto `mi-agente-dev-1793855157` indicado en `.firebaserc`, pero este checkout configura el `SITE_ID` `notebook-coffee-cesde` en `firebase.json`. Por eso se publica en `https://notebook-coffee-cesde.web.app/` sin comprar ni conectar un dominio.

Los sitios de Hosting dentro del mismo proyecto comparten Firebase Authentication y Firestore. El dominio del alias se agregó a los dominios autorizados de Authentication. No se creó otro proyecto ni se copiaron cuentas o documentos.

`js/publicacion.js` usa la misma URL para que los QR de recogida abran esta galería desde el computador o el teléfono. Si cambia el `SITE_ID`, hay que actualizar esa constante y el dominio autorizado.

Para publicar esta configuración localmente, ejecuta `python3 scripts/publicar-firebase.py --deploy`. El script lee el `SITE_ID` de `firebase.json`; el commit no cambia `.firebaserc` ni sube credenciales.
