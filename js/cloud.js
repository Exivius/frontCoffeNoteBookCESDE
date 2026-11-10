// Punto de acceso a Authentication y Firestore; app.js usa estas funciones para hablar con Firebase.
// async permite usar await: el navegador espera la respuesta sin congelar la página.
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import { getAuth, setPersistence, browserSessionPersistence, inMemoryPersistence, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, deleteUser, updatePassword } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-functions.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where,
  runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
// auth gestiona cuentas y sesiones; db permite leer y escribir documentos de Firestore.
export const auth = getAuth(app);
export const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
// Espera a que Firebase recupere la sesión antes de consultar el usuario en cada página.
export const ready = setPersistence(auth, browserSessionPersistence).then(() => auth.authStateReady());
// Encadena guardados del carrito para que varias acciones rápidas no se pisen entre sí.
let cartWrites = Promise.resolve();
const usernameKey = name => encodeURIComponent(name.trim().toLowerCase());
function validateProfile(data) {
  // Revisa los campos mínimos antes de enviar el perfil a Firestore.
  for (const key of ['nombre', 'nombreDeUsuario', 'direccion']) {
    if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > 150) {
      throw new Error('Completa el nombre, el usuario y la sede con datos válidos.');
    }
  }
  if (data.nombreDeUsuario.includes('@')) throw new Error('El nombre de usuario no debe incluir @; usa tu correo en ese campo para ingresar con correo.');
}
export function cloudError(error) {
  // Traduce códigos técnicos de Firebase a mensajes que la interfaz puede mostrar en español.
  const messages = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'El correo ya está registrado. Inicia sesión con tu cuenta.',
    'auth/invalid-email': 'Revisa el correo electrónico.',
    'auth/weak-password': 'Usa una contraseña de al menos 8 caracteres.',
    'auth/too-many-requests': 'Hay demasiados intentos. Espera unos minutos e intenta de nuevo.',
    'auth/requires-recent-login': 'Vuelve a iniciar sesión antes de cambiar tu contraseña.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión.',
    'functions/not-found': 'El acceso por nombre de usuario todavía no está disponible. Puedes ingresar con tu correo.',
    'functions/unavailable': 'No se pudo validar el usuario. Intenta de nuevo.',
    'functions/unauthenticated': 'Usuario o contraseña incorrectos.',
    'permission-denied': 'No tienes permiso para esta operación. Revisa tu sesión.',
    'unavailable': 'No se pudo conectar con la base de datos. Intenta de nuevo.',
  };
  return messages[error?.code] || error?.message || 'No se pudo completar la operación.';
}

function cacheProfile(profile) {
  sessionStorage.setItem('usuarioActual', JSON.stringify(profile));
  // Solo datos de la cuenta conectada; las contraseñas las gestiona Authentication.
  localStorage.setItem('usuarios', JSON.stringify([profile]));
}

export async function profile() {
  // async/await permite esperar la respuesta de Firebase antes de seguir; aquí también se valida que la cuenta siga activa.
  await ready;
  if (!auth.currentUser) return null;
  const record = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (!record.exists() || record.data().state !== 'Activo') {
    await signOut(auth);
    sessionStorage.removeItem('usuarioActual');
    throw new Error('Tu cuenta no está activa. Contacta al administrador.');
  }
  return record.data();
}

export async function login(identifier, password, admin = false) {
  // Primero autentica la cuenta; después carga su perfil y, si el panel lo solicita, comprueba el rol.
  await ready;
  const loginIdentifier = identifier.trim();
  // Los correos se validan directamente; el nombre de usuario se resuelve en una función privada
  // para no publicar los correos de las cuentas dentro de Firestore.
  if (loginIdentifier.includes('@')) {
    // Firebase Authentication inicia sesión directamente con el correo.
    await signInWithEmailAndPassword(auth, loginIdentifier.toLowerCase(), password);
  } else {
    // El backend busca el correo asociado al usuario y Authentication valida la contraseña.
    // Esta ruta requiere que loginWithUsername esté desplegada en Firebase.
    const resolveUsername = httpsCallable(functions, 'loginWithUsername');
    const { data } = await resolveUsername({ username: loginIdentifier, password });
    if (typeof data?.email !== 'string' || !data.email) {
      throw new Error('No se pudo iniciar sesión con ese usuario.');
    }
    await signInWithEmailAndPassword(auth, data.email.toLowerCase(), password);
  }
  const user = await profile();
  if (admin && user?.rol !== 'Admin') {
    await signOut(auth);
    sessionStorage.removeItem('usuarioActual');
    throw new Error('Esta cuenta no tiene permisos de administrador.');
  }
  cacheProfile(user);
  return user;
}

export async function logout() {
  // Cierra la sesión de Firebase y limpia las copias temporales usadas por la interfaz.
  await signOut(auth);
  sessionStorage.removeItem('usuarioActual');
  sessionStorage.removeItem('coffeeAdminSession');
  localStorage.removeItem('usuarios');
  localStorage.removeItem('ordenes');
}

export async function register(data, password) {
  // Authentication guarda la contraseña; Firestore guarda el perfil y reserva el nombre de usuario.
  validateProfile(data);
  if (typeof password !== 'string' || password.length < 8) throw new Error('Usa una contraseña de al menos 8 caracteres.');
  await ready;
  const credential = await createUserWithEmailAndPassword(auth, data.correo, password);
  // Firebase genera un UID estable que vincula la cuenta con su perfil en Firestore.
  const id = credential.user.uid;
  const user = { id, nombre: data.nombre, correo: data.correo, direccion: data.direccion,
    nombreDeUsuario: data.nombreDeUsuario, rol: 'User', state: 'Activo' };
  try {
    await runTransaction(db, async transaction => {
      // La transacción evita que dos registros reclamen el mismo nombre al mismo tiempo.
      const username = doc(db, 'usernames', usernameKey(user.nombreDeUsuario));
      if ((await transaction.get(username)).exists()) throw new Error('El nombre de usuario ya está registrado.');
      transaction.set(doc(db, 'users', id), user);
      transaction.set(username, { uid: id });
    });
  } catch (error) {
    await deleteUser(credential.user).catch(() => {});
    throw error;
  } finally { await signOut(auth); }
  return user;
}

export async function refreshProducts() {
  // Firestore es el origen de los productos; localStorage guarda una copia para dibujar la página.
  const records = await getDocs(collection(db, 'products'));
  const products = records.docs.map(record => record.data());
  localStorage.setItem('productos', JSON.stringify(products));
  return products;
}

export async function refreshOrders() {
  // La consulta filtra por el UID autenticado, así el historial corresponde a esta cuenta.
  if (!auth.currentUser) return [];
  const records = await getDocs(query(collection(db, 'orders'), where('clienteId', '==', auth.currentUser.uid)));
  const orders = records.docs.map(record => record.data()).sort((a, b) => a.dia.localeCompare(b.dia));
  localStorage.setItem('ordenes', JSON.stringify(orders));
  return orders;
}

export async function refreshCart() {
  if (!auth.currentUser) return;
  const snapshot = await getDoc(doc(db, 'carts', auth.currentUser.uid));
  const products = JSON.parse(localStorage.getItem('productos') || '[]');
  // Se completan los artículos guardados con el nombre, precio y stock actuales del catálogo.
  const items = (snapshot.exists() ? snapshot.data().items : []).map(item => ({
    ...item, producto: products.find(product => product.identificacion === item.producto.identificacion) || item.producto,
  }));
  localStorage.setItem(`carrito_${auth.currentUser.uid}`, JSON.stringify(items));
}

export function saveCart(cart) {
  // Guarda solo los artículos de esta cuenta; la cola mantiene el orden de los guardados.
  if (!auth.currentUser) return Promise.reject(new Error('Inicia sesión para guardar tu carrito.'));
  const uid = auth.currentUser.uid;
  const items = JSON.parse(JSON.stringify(cart.listaDeProductos));
  if (items.length > 9) return Promise.reject(new Error('Puedes seleccionar hasta 9 productos diferentes por pedido.'));
  cartWrites = cartWrites.catch(() => {}).then(() => setDoc(doc(db, 'carts', uid), { items }));
  return cartWrites;
}

export async function initializeCloud() {
  // Preparación común que ejecuta app.js al abrir una página: sesión, sedes y datos necesarios.
  await ready;
  const user = await profile();
  if (user) cacheProfile(user);
  else sessionStorage.removeItem('usuarioActual');
  const page = location.pathname.split('/').pop();
  const select = document.querySelector('select[name="address"]');
  if (select) {
    const places = (await getDocs(collection(db, 'places'))).docs.map(item => item.data());
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona tu sede';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.replaceChildren(placeholder);
    for (const place of places) {
      const option = document.createElement('option');
      option.value = place.placeName;
      option.textContent = place.placeName;
      select.append(option);
    }
  }
  if (user && !['index.html', 'registro.html', ''].includes(page)) {
    await refreshProducts();
    await refreshCart();
    if (page === 'orden.html') await refreshOrders();
  }
  return user;
}

export async function saveProfile(data, password = '') {
  // Cambia el perfil y reserva el nuevo usuario; si cambió el usuario, libera el nombre anterior.
  validateProfile(data);
  const current = await profile();
  if (!current) throw new Error('Inicia sesión para modificar tus datos.');
  if (data.correo !== current.correo) throw new Error('El correo de acceso se conserva. Puedes modificar tu nombre, usuario y sede.');
  if (password) await updatePassword(auth.currentUser, password);
  const updated = { ...current, nombre: data.nombre, nombreDeUsuario: data.nombreDeUsuario, direccion: data.direccion };
  await runTransaction(db, async transaction => {
    const oldName = doc(db, 'usernames', usernameKey(current.nombreDeUsuario));
    const newName = doc(db, 'usernames', usernameKey(updated.nombreDeUsuario));
    if (oldName.path !== newName.path) {
      const existing = await transaction.get(newName);
      if (existing.exists() && existing.data().uid !== current.id) throw new Error('El nombre de usuario ya está registrado.');
      transaction.delete(oldName);
      transaction.set(newName, { uid: current.id });
    }
    transaction.update(doc(db, 'users', current.id), updated);
  });
  cacheProfile(updated);
  return updated;
}

export async function createOrder(draft) {
  // Una transacción agrupa lecturas y escrituras: si una validación falla, no se guarda la orden ni se descuenta stock.
  await cartWrites;
  const user = await profile();
  if (!user) throw new Error('Inicia sesión para confirmar la compra.');
  const items = draft.listaDeProductos;
  if (!items.length || items.length > 9) throw new Error('Selecciona entre 1 y 9 productos diferentes para esta compra.');
  const orderId = draft.ordenId;
  let saved;
  await runTransaction(db, async transaction => {
    const orderRef = doc(db, 'orders', orderId);
    // Evita crear dos veces la misma orden si se repite el envío del formulario.
    if ((await transaction.get(orderRef)).exists()) throw new Error('Esta compra ya fue registrada.');
    const cartRef = doc(db, 'carts', user.id);
    const savedCart = await transaction.get(cartRef);
    const signature = values => JSON.stringify(values.map(item => [item.producto.identificacion, item.cantidad]).sort((a, b) => a[0].localeCompare(b[0])));
    // Compara productos y cantidades sin depender del orden en que aparecen en la lista.
    if (!savedCart.exists() || signature(savedCart.data().items) !== signature(items)) {
      throw new Error('Tu carrito cambió en otro dispositivo. Revísalo antes de confirmar el pago.');
    }
    const snapshots = await Promise.all(items.map(item => transaction.get(doc(db, 'products', String(item.producto.identificacion)))));
    // Antes de escribir, revisa que cada producto exista y que precio y stock sigan vigentes.
    const quantities = {};
    const detail = snapshots.map((snapshot, index) => {
      const product = snapshot.data();
      const quantity = items[index].cantidad;
      if (!snapshot.exists() || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
        throw new Error('Uno de los productos ya no tiene stock suficiente. Revisa el carrito.');
      }
      if (Number(items[index].producto.precio) !== Number(product.precio)) throw new Error('El precio cambió. Revisa el carrito para confirmar el total actualizado.');
      if (quantities[product.identificacion]) throw new Error('El carrito contiene un producto repetido.');
      quantities[product.identificacion] = quantity;
      return { producto: product, cantidad: quantity };
    });
    saved = { ...draft, clienteId: user.id, nombreCliente: user.nombre, sedeRecogida: user.direccion,
      listaDeProductos: detail, cantidadPorProducto: quantities,
      total: detail.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0),
      historialChat: [], confirmacionRecogida: null, createdAt: serverTimestamp() };
    // Firestore confirma estos cambios como un conjunto; si falla la operación, no queda media compra guardada.
    snapshots.forEach((snapshot, index) => transaction.update(snapshot.ref, {
      stock: snapshot.data().stock - detail[index].cantidad, lastOrderId: orderId,
    }));
    transaction.set(orderRef, saved);
    transaction.set(cartRef, { items: [] });
  });
  await refreshProducts();
  await refreshOrders();
  await refreshCart();
  return saved;
}

export async function saveConfirmation(orderId, confirmation) {
  // Añade la respuesta del cliente al historial de esa orden, después de comprobar que le pertenece.
  if (!auth.currentUser) throw new Error('Tu sesión terminó. Inicia sesión de nuevo.');
  let result;
  await runTransaction(db, async transaction => {
    const reference = doc(db, 'orders', orderId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists() || snapshot.data().clienteId !== auth.currentUser.uid) throw new Error('No se encontró esta compra en tu cuenta.');
    const order = snapshot.data();
    const previous = Array.isArray(order.historialChat) ? order.historialChat : [];
    result = { ...order, confirmacionRecogida: confirmation, historialChat: [...previous, confirmation] };
    transaction.update(reference, { confirmacionRecogida: confirmation, historialChat: result.historialChat });
  });
  await refreshOrders();
  return result;
}

export async function adminRecords(resource) {
  // El panel solicita registros aquí; las reglas de Firestore vuelven a comprobar el permiso de administrador.
  const user = await profile();
  if (user?.rol !== 'Admin') throw new Error('Se requiere una cuenta de administrador.');
  const entity = { users: 'users', admins: 'users', products: 'products', places: 'places', orders: 'orders', payments: 'orders', 'payment-methods': 'paymentMethods' }[resource];
  if (!entity) throw new Error('Sección no disponible.');
  const rows = (await getDocs(collection(db, entity))).docs.map(record => ({ ...record.data(), _docId: record.id }));
  if (resource === 'users' || resource === 'admins') return rows.filter(row => row.rol === (resource === 'admins' ? 'Admin' : 'User')).map(row => ({ ...row, name: row.nombre, username: row.nombreDeUsuario, email: row.correo, city: row.direccion }));
  if (resource === 'products') return rows.map(row => ({ ...row, productId: row.identificacion, productName: row.nombre, productPrice: row.precio, productType: row.categoria, description: row.descripcion }));
  if (resource === 'orders') return rows.map(row => ({ ...row, orderId: row.ordenId, userId: row.nombreCliente, placeId: row.sedeRecogida, items: row.listaDeProductos.map(item => ({ product: { productName: item.producto.nombre }, quantity: item.cantidad })) }));
  if (resource === 'payments') return rows.map(row => ({ paymentId: row.ordenId, orderId: row.ordenId, paymentType: row.metodoDePago === 'contra entrega' ? 'Pendiente al recoger' : 'Pago registrado', methodId: /nequi/i.test(row.metodoDePago) ? 'Nequi' : row.metodoDePago, amount: row.total }));
  return rows;
}

export async function adminWrite(resource, method, id, data) {
  // Centraliza altas, cambios y bajas administrativas para no duplicar las operaciones de base de datos en la pantalla.
  const admin = await profile();
  if (admin?.rol !== 'Admin') throw new Error('Se requiere una cuenta de administrador.');
  if (['orders', 'payments'].includes(resource)) throw new Error('Los pedidos y pagos son de consulta.');
  if (['users', 'admins'].includes(resource)) {
    if (method === 'DELETE') {
      if (id === admin.id) throw new Error('No puedes eliminar tu propia cuenta.');
      await updateDoc(doc(db, 'users', id), { state: 'Inactivo' });
      return;
    }
    if (method === 'PUT') {
      if (data.password) throw new Error('Cada persona cambia su contraseña desde su perfil.');
      const userRef = doc(db, 'users', id);
      const currentSnapshot = await getDoc(userRef);
      if (!currentSnapshot.exists()) throw new Error('No se encontró la cuenta que quieres modificar.');
      const current = currentSnapshot.data();
      if (data.email !== current.correo) throw new Error('El correo de acceso no se modifica desde este panel.');
      if (id === admin.id && data.state !== 'Activo') throw new Error('No puedes desactivar tu propia cuenta.');
      const username = typeof data.username === 'string' ? data.username.trim() : '';
      if (!username || username.includes('@')) throw new Error('Escribe un nombre de usuario sin @.');
      const oldUsernameRef = doc(db, 'usernames', usernameKey(current.nombreDeUsuario));
      const newUsernameRef = doc(db, 'usernames', usernameKey(username));
      await runTransaction(db, async transaction => {
        const existingUsername = await transaction.get(newUsernameRef);
        if (newUsernameRef.path !== oldUsernameRef.path) {
          const oldUsername = await transaction.get(oldUsernameRef);
          if (existingUsername.exists() && existingUsername.data().uid !== id) {
            throw new Error('Ese nombre de usuario ya está registrado.');
          }
          if (!oldUsername.exists() || oldUsername.data().uid !== id) {
            throw new Error('No se encontró la reserva del nombre de usuario actual.');
          }
          transaction.delete(oldUsernameRef);
          transaction.set(newUsernameRef, { uid: id });
        }
        transaction.update(userRef, { nombre: data.name, nombreDeUsuario: username, lastName: data.lastName || '', phone: data.phone || '', direccion: data.city || current.direccion, area: data.area || '', state: data.state });
      });
      return;
    }
    const secondary = initializeApp(firebaseConfig, 'create-user-' + crypto.randomUUID());
    const secondaryAuth = getAuth(secondary);
    await setPersistence(secondaryAuth, inMemoryPersistence);
    let credential;
    try {
      if (!data.password || data.password.length < 8) throw new Error('Usa una contraseña de al menos 8 caracteres.');
      const username = typeof data.username === 'string' ? data.username.trim() : '';
      if (!username || username.includes('@')) throw new Error('Escribe un nombre de usuario sin @.');
      credential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
      const uid = credential.user.uid;
      const user = { id: uid, nombre: data.name, lastName: data.lastName || '', correo: data.email.toLowerCase(), phone: data.phone || '', direccion: data.city || 'Centro', nombreDeUsuario: username, rol: resource === 'admins' ? 'Admin' : 'User', state: data.state || 'Activo', area: data.area || '' };
      await runTransaction(db, async transaction => {
        const usernameRef = doc(db, 'usernames', usernameKey(username));
        if ((await transaction.get(usernameRef)).exists()) throw new Error('Ese nombre de usuario ya está registrado.');
        transaction.set(doc(db, 'users', uid), user);
        transaction.set(usernameRef, { uid });
      });
    } catch (error) {
      if (credential) await deleteUser(credential.user).catch(() => {});
      throw error;
    } finally { await signOut(secondaryAuth); await deleteApp(secondary); }
    return;
  }
  const entity = { products: 'products', places: 'places', 'payment-methods': 'paymentMethods' }[resource];
  if (!entity) throw new Error('Sección no disponible.');
  const ref = id ? doc(db, entity, id) : doc(collection(db, entity));
  if (method === 'DELETE') { await deleteDoc(ref); return; }
  let value = { ...data };
  if (resource === 'products') value = { identificacion: ref.id, nombre: data.productName, precio: data.productPrice, categoria: data.productType, descripcion: data.description || '', stock: data.stock, lastOrderId: '' };
  if (resource === 'places') value.placeId = ref.id;
  if (resource === 'payment-methods') value.methodId = ref.id;
  await setDoc(ref, value, { merge: method === 'PUT' });
}
