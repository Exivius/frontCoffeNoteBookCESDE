// Función opcional para resolver el usuario sin publicar los correos en Firestore.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

admin.initializeApp();

const genericAuthError = () => new HttpsError('unauthenticated', 'Usuario o contraseña incorrectos.');

// Resuelve el usuario solo en servidor: así Firestore no necesita revelar correos para iniciar sesión.
exports.loginWithUsername = onCall({
  region: 'us-central1',
  maxInstances: 2,
}, async (request) => {
  const username = typeof request.data?.username === 'string'
    ? request.data.username.trim().toLowerCase()
    : '';
  const password = request.data?.password;
  if (!username || username.length > 150 || typeof password !== 'string' || !password) {
    throw genericAuthError();
  }

  const usernameId = encodeURIComponent(username);
  const mapping = await admin.firestore().doc(`usernames/${usernameId}`).get();
  if (!mapping.exists || typeof mapping.data()?.uid !== 'string') throw genericAuthError();

  const uid = mapping.data().uid;
  const profileSnapshot = await admin.firestore().doc(`users/${uid}`).get();
  if (!profileSnapshot.exists) throw genericAuthError();
  const profile = profileSnapshot.data();
  if (profile.state !== 'Activo' || typeof profile.correo !== 'string'
      || profile.nombreDeUsuario?.trim().toLowerCase() !== username) throw genericAuthError();

  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) throw new HttpsError('internal', 'Falta configurar la clave web de Firebase en Functions.');

  // Firebase Authentication valida la contraseña sin revelar el correo en la respuesta de error.
  let identity;
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.correo, password, returnSecureToken: true }),
    });
    if (!response.ok) throw genericAuthError();
    identity = await response.json();
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('unavailable', 'No se pudo validar el acceso. Intenta de nuevo.');
  }

  if (identity.localId !== uid) throw genericAuthError();
  // Solo devuelve el correo tras validar la contraseña. El cliente inicia su sesión normal con Auth.
  return { email: profile.correo };
});
