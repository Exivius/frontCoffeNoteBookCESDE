# Ingreso por correo o nombre de usuario

El formulario público y el de administración aceptan correo o nombre de usuario. El correo se valida directamente con Firebase Authentication. Para ingresar con usuario, `loginWithUsername` resuelve el documento privado `usernames/{usuario}`, comprueba que el perfil esté activo y valida la contraseña contra Firebase Authentication. Solo después de validarla devuelve el correo para que el cliente abra su sesión normal.

La función evita exponer los correos guardados en `users`. Las credenciales nunca se guardan en Firestore ni en el navegador después del intento de inicio de sesión.

## Administrador de práctica

- Correo: `admin@admin.com`.
- Usuario: `admin`.
- La cuenta existente se prepara con estado `Activo` y rol `Admin` mediante `scripts/configurar-firebase.py`.
- La contraseña la administra Firebase Authentication. El archivo local privado `~/.config/notebook-coffee/administrador.json` puede conservar la clave inicial y quedar desactualizado si se cambia la contraseña. El correo es de práctica; no se debe depender de recibir allí mensajes de restablecimiento.

## Preparar Functions

1. Copiar `functions/.env.example` como `functions/.env.mi-agente-dev-1793855157` y completar `FIREBASE_WEB_API_KEY` con el valor de `js/firebase-config.js`.
2. Instalar dependencias desde `functions/` con `npm install`.
3. Publicar la función `loginWithUsername` con Firebase CLI.

Cloud Functions requiere el plan Blaze con una cuenta de facturación vinculada. El código queda listo en esta rama local; no se publica automáticamente. Antes de publicar, confirmar el plan del proyecto y configurar alertas de presupuesto.
