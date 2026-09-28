import Producto, { Almuerzo, CarroDeCompras, Cena, Cliente, Desayuno, MetodoDePago, Orden } from './modelos.js';

//claves o tablas de la BD simulada
const CLAVES = {
    usuarios: 'usuarios',
    productos: 'productos',
    ordenes: 'ordenes',
    usuarioActivo: 'usuarioActual',
    ultimaOrden: 'ultimaOrden'

};

const productosIniciales = [
    {identificacion: 'breakfast', nombre: 'Combo CESDE', descripcion: 'huevos al gusto con tostada y bebida caliente' , precio: '8550' , stock: '20' , categoria: 'Desayuno', huevosPreparados: 'Revueltos' , tipoDePan: 'tajado tostado' , tipoDeLeche: 'Entera' , incluyeFruta: true},
    {identificacion: 'lunch' , nombre: 'Almuerzo del dia', descripcion: 'Menu especial para estudiantes' , precio: '12500' , stock: '25' , categoria: 'Almuerzo', tipoDeProteina:'Pechuga a la plancha' , terminoDeCarne: 'Bien asada' , guarnicion: 'salsa BBQ' , sopaDelDia: 'crema de tomate'},
    {identificacion: 'Dinner' , nombre: 'Sandwich de pollo' , descripcion: 'Opción ligera para jornada nocturna' , precio: '11000', stock: '21' , categoria: 'Cena', tipoDePreparacion: 'rapida'},
            
];

//constante para ller el JSON en el local storage y devolver un valor inicial si no existe
//Evita que cada que se inicia la aplicación se creen nuevamente los valores iniciales para los productos del carrito
const leer = (clave, valorInicial) => {
	try {
		const guardado = localStorage.getItem(clave);
		return guardado ? JSON.parse(guardado) : valorInicial;
	} catch (error) {
		return valorInicial;
	}
};

//metodo para el guardado de datos luego de la validación en LocalStorage
const guardar = (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor));
//Metodo para guardar el usuario activo
const usuarioActivo = () => {
    const usuarioGuardado = sessionStorage.getItem(CLAVES.usuarioActivo);
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
};

//Protegemos las paginas a excepción del login y el formulario de registro para que no sea
//visibles a menos que exista un usuario logueado activamente. Divide la URL para encontrar
//El nombre de la pagina. Si no encuentra un valor valido, devuelve por defecto la pagina index.HTML
const pagina = () => window.location.pathname.split('/').pop() || 'index.html';

function protegerPaginas(){
    const paginasProtegidas = ['catalogo.html', 'carrito.html', 'pago.html', 'orden.html', 'perfil.html'];
    if(paginasProtegidas.includes(pagina()) && !usuarioActivo()){
        window.location.href = "index.html?message=Debes iniciar sesión para continuar";
        return false;
    }
    return true;
}

//Convertidos los productos ya guardados en el tipo de clase al que corresponden en modelos.js
function crearProductos(datos){
    if (datos.categoria === 'Desayuno') {
        return new Desayuno(
            datos.identificacion,
            datos.nombre,
            datos.descripcion,
            Number(datos.precio),
            Number(datos.stock),
            datos.huevosPreparados,
            datos.tipoDePan,
            datos.tipoDeLeche,
            datos.incluyeFruta
        );
    }
    if (datos.categoria === 'Almuerzo') {
        return new Almuerzo(
            datos.identificacion,
            datos.nombre,
            datos.descripcion,
            Number(datos.precio),
            Number(datos.stock),
            datos.tipoDeProteina,
            datos.terminoDeCarne,
            datos.guarnicion,
            datos.sopaDelDia
        );
    }

    if (datos.categoria === 'Cena') {
        return new Cena(
            datos.identificacion,
            datos.nombre,
            datos.descripcion,
            Number(datos.precio),
            Number(datos.stock),
            datos.porcionLigera,
            datos.paraCompartir,
            datos.tipoDePreparacion
        );
    }

    return null;
}

//Se inicializa la tabla de productos
function obtenerProductos(){
    let datos = leer(CLAVES.productos, null);
    if(!datos || !datos.length){
        datos = productosIniciales;
        guardar(CLAVES.productos, datos);
    } 
    return datos.map(crearProductos)
}

//Dado que existen varios usuarios, es necesario obtener el carrito especifico ligado al usuario que esta logueado
function obtenerCarrito() {
    const usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActual") || "null");

    if (!usuarioActual) {
        return new CarroDeCompras("carrito_sin_usuario", [], 0);
    }

    const carritoId = `carrito_${usuarioActual.id}`;
    const carritoGuardado = JSON.parse(localStorage.getItem(carritoId) || "[]");

    return new CarroDeCompras(carritoId, carritoGuardado, 0);
}

/*function guardarCarrito(carrito){
    if(carrito.usuarioActual !== 'carrito_sin_usuario') guardar(`carrito_${carrito.usuarioActual}`, carrito.listaDeProductos)
}*/

function guardarCarrito(carrito) {
    const usuario = usuarioActivo();

    if (!usuario) return;

    const clave = `carrito_${usuario.id}`;
    guardar(clave, (carrito.listaDeProductos));
}

//funcion para mostrar mensajes de advertencia al usuario en caso de que no cumpla con algun requesito para
//enviar apropiadamente el formulario o continuar con el proceso de compra
function mostrarAdvertencia(texto, id){
    const elemento =  document.querySelector(`#${id}`);
    if(elemento) elemento.textContent = texto
}

// pintar usuario en la cabecera

function configurarRegistro(){
    const formulario = document.querySelector('#registerForm');
    if(!formulario) return;

    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const datos = new FormData(formulario);
        const cliente  = new Cliente({
            nombre: datos.get('name').trim(),
            correo: datos.get('email').trim().toLowerCase(),
            direccion: datos.get('address'),
            contrasena: datos.get('password'),
            nombreDeUsuario: datos.get('userName').trim()
            
        });
        const mensaje = document.querySelector('#registerMessage');
        if(cliente.registrarse()){
            mensaje.textContent = "Registro éxitoso. Ahora puedes iniciar sesión";
            formulario.reset();
        } else {
            mensaje.textContent = "El correo o nombre de usuario ya estan registrados";
            //Se usa classList para que modifique el CSS de forma rapida y temporal al mostrar un mensaje transitorio
            mensaje.classList.add('form-message--error');
        }
    });
}

function configurarLogin(){
    const formulario = document.querySelector('#loginForm');
    if(!formulario) return;
    const mensaje = document.querySelector('#loginError');
    const aviso = new URLSearchParams(window.location.search).get('mensaje');
    if(aviso) mensaje.textContent = aviso;
    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        //Guardamos todos los datos del formulario en una variable
        const datos = new FormData(formulario);
        //Convertimos todo el nombre de usuario a minusculas
        const nombreDeUsuario = datos.get('userName').trim().toLowerCase();
        const usuarios = leer(CLAVES.usuarios, []);
        //Validamos que lo que el usuario ingresa en el campo de texto del login coincida con el correo registrado o el nombre de usuario registrado
        const indice = usuarios.findIndex((usuario) => usuario.correo.toLowerCase() === nombreDeUsuario || usuario.nombreDeUsuario.toLowerCase() === nombreDeUsuario);
        const usuario = usuarios[indice];
        const ahora = Date.now();
        if(!usuario){
            mensaje.textContent = 'No existe un usuario con estos datos.';
            return;
        }
        if(usuario.bloqueadoHasta && ahora < usuario.bloqueadoHasta){
            mensaje.textContent = "Usuario bloqueado por 24 horas, contacte a su administrador";
            return;
        }
        if(usuario.bloqueadoHasta && ahora >= usuario.bloqueadoHasta){
            usuario.bloqueadoHasta = null;
            usuario.intentosFallidos = 0;
        }
        if(usuario.contrasena != datos.get('password')){
            usuario.intentosFallidos++;
            if(usuario.intentosFallidos >= 3){
                usuario.bloqueadoHasta = ahora + 24 * 60 * 60 * 1000;
                mensaje.textContent = "Ha superado el numero de intentos permitidos. Usuario bloqueado por 24 horas o comuniquese con el administrador del sistema."
            }else{
                mensaje.textContent = `Credenciales incorrectas. intento ${usuario.intentosFallidos} de 3`;
            }
            //Actualizamos los parametros para bloquear el usuario
            guardar(CLAVES.usuarios, usuarios)
            return;
        }
        usuario.intentosFallidos = 0;
        usuario.bloqueadoHasta = null;
        //Guardamos en la base de datos los parametros actualizados
        guardar(CLAVES.usuarios, usuarios);
        //Si el proceso de validación es exitoso, guardamos una sesion activa para el usuario
        sessionStorage.setItem(CLAVES.usuarioActivo, JSON.stringify({
            id: usuario.id,
            nombre: usuario.nombre,
            nombreDeUsuario: usuario.nombreDeUsuario,
            correo: usuario.correo,
            direccion: usuario.direccion
            
        }));
        window.location.href = 'catalogo.html';
    });
}

    function cargarTarjetas(){
    const lista =  document.querySelector('#productList');
    if(!lista) return;
    const productos =  obtenerProductos();
    const imagenesProductos = {
        breakfast: './images/breakfast.png',
        lunch: './images/lunch.png',
        dinner: './images/dinner.png'
    };
    //Usamos innerHTML para insertar un nuevo elemento html dentro del elemento HTML guardado dentro de lista
    lista.innerHTML = productos.map((producto) => {
        const info = producto.mostrarDatos();
        return `<article class="product-card" data-category="${info.identificacion}">
			<img class="product-image product-image--${info.identificacion.toLowerCase()}" src="${imagenesProductos[info.identificacion.toLowerCase()]}" alt="${info.nombre}" loading="lazy">
			<div class="product-card__body"><div class="product-card__topline"><span class="tag">${info.categoria}</span><span class="stock-label">${info.stock} disponibles</span></div>
			<h3>${info.nombre}</h3><p>${info.descripcion}</p><div class="product-card__footer"><strong class="price">${formatoMoneda.format(info.precio)}</strong>
			<div class="quantity-control"><label for="quantity-${info.identificacion}">Cantidad</label><input id="quantity-${info.identificacion}" type="number" min="0" max="${info.stock}" value="0" data-product-id="${info.identificacion}"></div>
			<button class="button button--primary button--icon" type="button" data-action="add-to-cart" data-product-id="${info.identificacion}" aria-label="Agregar ${info.nombre} al carrito" title="Agregar producto al carrito" data-tooltip="Agregar producto al carrito">+</button></div></div></article>`;
	}).join(''); //join convierte el arreglo que muestra mal y lo transforma en HTML
    //Creamos un contador para mostrar los productos que hay disponibles para la compra
    const contador =  document.querySelector('#productCount')
    if (contador) contador.textContent = `${productos.length} productos disponibles`;
    lista.addEventListener('click', (evento) => {
        //target es el elemento html donde el cursor hace click
        //closest busca sobre el target la referencia a la que se le esta haciendo relación y ejecuta el evento
        const boton = evento.target.closest('[data-action="add-to-cart"]');
        if(!boton) return;
        //dataset.productId hace referencia al boton para agregar productos en las tarjetas del catalogo
        //Indicado cuales son los id de producto que se deben insertar al carrito
        const entrada = lista.querySelector(`input[data-product-id = "${boton.dataset.productId}"]`);
        //Hace referencia a el valor que se encuentra al lado del boton, de modo que el sistema sabe cuanto agregar una vez
        //se ejecuta el evento de click     
        const cantidadSeleccionada = Number(entrada.value);
        //Guarda el producto especifico sobre el que haga click
        const producto = productos.find(
            (item) => item.identificacion === boton.dataset.productId);
        if(!Number.isInteger(cantidadSeleccionada) || cantidadSeleccionada < 1) return mostrarAdvertencia('Seleccione una cantidad mayor a cero.', 'catalogMessage');
        //Agrega los productos al carrito de compras
        const carrito = obtenerCarrito();
        //Buscamos cuantas unidades de este producto existen actualmente agregadas al carrito
        const cantidadActual = carrito.listaDeProductos.find((item) => item.producto.identificacion === producto.identificacion)?.cantidad || 0;
        //Si existe actualmente el producto agregado, suma la nueva cantidad que se va a agregar
        //Si no hay id del producto (o esta en 0), se agrega la cantidad seleccionada por el usuario
        if(cantidadActual + cantidadSeleccionada > producto.stock) return mostrarAdvertencia('La cantidad seleccionada supera el stock disponible', 'catalogMessage');
        carrito.agregarProducto(producto, cantidadSeleccionada);
        guardarCarrito(carrito);
        entrada.value = '0';
        mostrarAdvertencia('Producto agregado exitosamente al carrito', 'catalogMessage')
    });
    }

// Formateador reutilizable: es-CO usa las convenciones de Colombia (punto para miles).
// .format(precio) devuelve texto para mostrar; no modifica el número usado en los cálculos.
// Se inicializa antes de ejecutar cargarTarjetas(), donde se utiliza para mostrar los precios.
const formatoMoneda = new Intl.NumberFormat('es-CO', {
    style: 'currency', // Presenta el valor como dinero e incluye el símbolo de moneda.
    currency: 'COP', // Utiliza pesos colombianos.
    maximumFractionDigits: 0 // Muestra pesos sin decimales; redondea solo la presentación.
});
// Muestra el usuario de la sesión y conecta el botón para cerrar sesión.
// Comprueba que los elementos existan porque app.js se carga en varias páginas.
function configurarCabecera() {
    const usuario = usuarioActivo();
    if (!usuario) return;

    const nombre = document.querySelector('#loggedUserName');
    if (nombre) {
        // Escribe el nombre como texto, sin interpretarlo como HTML.
        nombre.textContent = usuario.nombre;
    }

    const botonSalir = document.querySelector('#logoutButton');
    if (botonSalir) {
        botonSalir.addEventListener('click', () => {
            // Elimina solo la sesión activa; conserva los usuarios y los carritos guardados.
            sessionStorage.removeItem(CLAVES.usuarioActivo);
            window.location.href = 'index.html';
        });
    }
}


//Falta por crear la funcionalidad del boton para el historial de las ordenes y el evento que se activa al dar click sobre
//el boton del historial
//Crear la clase que da funcionalidad al boton de "Finalizar compra"

//localStorage.clear();

if(protegerPaginas()){
    configurarCabecera();
    configurarLogin();
    configurarRegistro();
    cargarTarjetas();
    
}

