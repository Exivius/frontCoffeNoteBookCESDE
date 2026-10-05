import Producto, {
  Almuerzo,
  CarroDeCompras,
  Cena,
  Cliente,
  Desayuno,
  MetodoDePago,
  Orden,
} from "./modelos.js";

//claves o tablas de la BD simulada
const CLAVES = {
  usuarios: "usuarios",
  productos: "productos",
  ordenes: "ordenes",
  usuarioActivo: "usuarioActual",
  ultimaOrden: "ultimaOrden",
};

const productosIniciales = [
  {
    identificacion: "breakfast",
    nombre: "Combo CESDE",
    descripcion: "huevos al gusto con tostada y bebida caliente",
    precio: "8550",
    stock: "20",
    categoria: "Desayuno",
    huevosPreparados: "Revueltos",
    tipoDePan: "tajado tostado",
    tipoDeLeche: "Entera",
    incluyeFruta: true,
  },
  {
    identificacion: "lunch",
    nombre: "Almuerzo del dia",
    descripcion: "Menu especial para estudiantes",
    precio: "12500",
    stock: "25",
    categoria: "Almuerzo",
    tipoDeProteina: "Pechuga a la plancha",
    terminoDeCarne: "Bien asada",
    guarnicion: "salsa BBQ",
    sopaDelDia: "crema de tomate",
  },
  {
    identificacion: "Dinner",
    nombre: "Sandwich de pollo",
    descripcion: "Opción ligera para jornada nocturna",
    precio: "11000",
    stock: "21",
    categoria: "Cena",
    tipoDePreparacion: "rapida",
  },
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

//metodo helper para el guardado de datos luego de la validación en LocalStorage
const guardar = (clave, valor) =>
  localStorage.setItem(clave, JSON.stringify(valor));
//Metodo para guardar el usuario activo
const usuarioActivo = () => {
  const usuarioGuardado = sessionStorage.getItem(CLAVES.usuarioActivo);
  return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
};

//Protegemos las paginas a excepción del login y el formulario de registro para que no sea
//visibles a menos que exista un usuario logueado activamente. Divide la URL para encontrar
//El nombre de la pagina. Si no encuentra un valor valido, devuelve por defecto la pagina index.HTML
const pagina = () => window.location.pathname.split("/").pop() || "index.html";

function protegerPaginas() {
  const paginasProtegidas = [
    "catalogo.html",
    "carrito.html",
    "pago.html",
    "orden.html",
    "perfil.html",
  ];
  if (paginasProtegidas.includes(pagina()) && !usuarioActivo()) {
    window.location.href =
      "index.html?message=Debes iniciar sesión para continuar";
    return false;
  }
  return true;
}

//Convertidos los productos ya guardados en el tipo de clase al que corresponden en modelos.js
function crearProductos(datos) {
  if (datos.categoria === "Desayuno") {
    return new Desayuno(
      datos.identificacion,
      datos.nombre,
      datos.descripcion,
      Number(datos.precio),
      Number(datos.stock),
      datos.huevosPreparados,
      datos.tipoDePan,
      datos.tipoDeLeche,
      datos.incluyeFruta,
    );
  }
  if (datos.categoria === "Almuerzo") {
    return new Almuerzo(
      datos.identificacion,
      datos.nombre,
      datos.descripcion,
      Number(datos.precio),
      Number(datos.stock),
      datos.tipoDeProteina,
      datos.terminoDeCarne,
      datos.guarnicion,
      datos.sopaDelDia,
    );
  }

  if (datos.categoria === "Cena") {
    return new Cena(
      datos.identificacion,
      datos.nombre,
      datos.descripcion,
      Number(datos.precio),
      Number(datos.stock),
      datos.porcionLigera,
      datos.paraCompartir,
      datos.tipoDePreparacion,
    );
  }

  return null;
}

//Se inicializa la tabla de productos
function obtenerProductos() {
  let datos = leer(CLAVES.productos, null);
  if (!datos || !datos.length) {
    datos = productosIniciales;
    guardar(CLAVES.productos, datos);
  }
  return datos.map(crearProductos);
}

//Dado que existen varios usuarios, es necesario obtener el carrito especifico ligado al usuario que esta logueado
function obtenerCarrito() {
  const usuarioActual = JSON.parse(
    sessionStorage.getItem("usuarioActual") || "null",
  );

  if (!usuarioActual) {
    return new CarroDeCompras("carrito_sin_usuario", [], 0);
  }

  const carritoId = `carrito_${usuarioActual.id}`;
  const carritoGuardado = JSON.parse(localStorage.getItem(carritoId) || "[]");

  return new CarroDeCompras(carritoId, carritoGuardado, 0);
}


function guardarCarrito(carrito) {
  const usuario = usuarioActivo();

  if (!usuario) return;

  const clave = `carrito_${usuario.id}`;
  guardar(clave, carrito.listaDeProductos);
}

//funcion para mostrar mensajes de advertencia al usuario en caso de que no cumpla con algun requesito para
//enviar apropiadamente el formulario o continuar con el proceso de compra
function mostrarAdvertencia(texto, id) {
  const elemento = document.querySelector(`#${id}`);
  if (elemento) elemento.textContent = texto;
}

// pintar usuario en la cabecera

function configurarRegistro() {
  const formulario = document.querySelector("#registerForm");
  if (!formulario) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    const cliente = new Cliente({
      nombre: datos.get("name").trim(),
      correo: datos.get("email").trim().toLowerCase(),
      direccion: datos.get("address"),
      contrasena: datos.get("password"),
      nombreDeUsuario: datos.get("userName").trim(),
    });
    const mensaje = document.querySelector("#registerMessage");
    if (cliente.registrarse()) {
      mensaje.textContent = "Registro éxitoso. Ahora puedes iniciar sesión";
      formulario.reset();
    } else {
      mensaje.textContent =
        "El correo o nombre de usuario ya estan registrados";
      //Se usa classList para que modifique el CSS de forma rapida y temporal al mostrar un mensaje transitorio
      mensaje.classList.add("form-message--error");
    }
  });
}

function configurarLogin() {
  const formulario = document.querySelector("#loginForm");
  if (!formulario) return;
  const mensaje = document.querySelector("#loginError");
  const aviso = new URLSearchParams(window.location.search).get("mensaje");
  if (aviso) mensaje.textContent = aviso;
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    //Guardamos todos los datos del formulario en una variable
    const datos = new FormData(formulario);
    //Convertimos todo el nombre de usuario a minusculas
    const nombreDeUsuario = datos.get("userName").trim().toLowerCase();
    const usuarios = leer(CLAVES.usuarios, []);
    //Validamos que lo que el usuario ingresa en el campo de texto del login coincida con el correo registrado o el nombre de usuario registrado
    const indice = usuarios.findIndex(
      (usuario) =>
        usuario.correo.toLowerCase() === nombreDeUsuario ||
        usuario.nombreDeUsuario.toLowerCase() === nombreDeUsuario,
    );
    const usuario = usuarios[indice];
    const ahora = Date.now();
    if (!usuario) {
      mensaje.textContent = "No existe un usuario con estos datos.";
      return;
    }
    if (usuario.bloqueadoHasta && ahora < usuario.bloqueadoHasta) {
      mensaje.textContent =
        "Usuario bloqueado por 24 horas, contacte a su administrador";
      return;
    }
    if (usuario.bloqueadoHasta && ahora >= usuario.bloqueadoHasta) {
      usuario.bloqueadoHasta = null;
      usuario.intentosFallidos = 0;
    }
    if (usuario.contrasena != datos.get("password")) {
      usuario.intentosFallidos++;
      if (usuario.intentosFallidos >= 3) {
        usuario.bloqueadoHasta = ahora + 24 * 60 * 60 * 1000;
        mensaje.textContent =
          "Ha superado el numero de intentos permitidos. Usuario bloqueado por 24 horas o comuniquese con el administrador del sistema.";
      } else {
        mensaje.textContent = `Credenciales incorrectas. intento ${usuario.intentosFallidos} de 3`;
      }
      //Actualizamos los parametros para bloquear el usuario
      guardar(CLAVES.usuarios, usuarios);
      return;
    }
    usuario.intentosFallidos = 0;
    usuario.bloqueadoHasta = null;
    //Guardamos en la base de datos los parametros actualizados
    guardar(CLAVES.usuarios, usuarios);
    //Si el proceso de validación es exitoso, guardamos una sesion activa para el usuario
    sessionStorage.setItem(
      CLAVES.usuarioActivo,
      JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        nombreDeUsuario: usuario.nombreDeUsuario,
        correo: usuario.correo,
        direccion: usuario.direccion,
      }),
    );
    window.location.href = "catalogo.html";
  });
}

function cargarTarjetas() {
  const lista = document.querySelector("#productList");
  if (!lista) return;
  const productos = obtenerProductos();
  const imagenesProductos = {
    breakfast: "./images/breakfast.png",
    lunch: "./images/lunch.png",
    dinner: "./images/dinner.png",
  };
  //Usamos innerHTML para insertar un nuevo elemento html dentro del elemento HTML guardado dentro de lista
  lista.innerHTML = productos
    .map((producto) => {
      const info = producto.mostrarDatos();
      return `<article class="product-card" data-category="${info.identificacion}">
			<img class="product-image product-image--${info.identificacion.toLowerCase()}" src="${imagenesProductos[info.identificacion.toLowerCase()]}" alt="${info.nombre}" loading="lazy">
			<div class="product-card__body"><div class="product-card__topline"><span class="tag">${info.categoria}</span><span class="stock-label">${info.stock} disponibles</span></div>
			<h3>${info.nombre}</h3><p>${info.descripcion}</p><div class="product-card__footer"><strong class="price">${formatoMoneda.format(info.precio)}</strong>
			<div class="quantity-control"><label for="quantity-${info.identificacion}">Cantidad</label><input id="quantity-${info.identificacion}" type="number" min="0" max="${info.stock}" value="0" data-product-id="${info.identificacion}"></div>
			<button class="button button--primary button--icon" type="button" data-action="add-to-cart" data-product-id="${info.identificacion}" aria-label="Agregar ${info.nombre} al carrito" title="Agregar producto al carrito" data-tooltip="Agregar producto al carrito">+</button></div></div></article>`;
    })
    .join(""); //join convierte el arreglo que muestra mal y lo transforma en HTML
  //Creamos un contador para mostrar los productos que hay disponibles para la compra
  const contador = document.querySelector("#productCount");
  if (contador)
    contador.textContent = `${productos.length} productos disponibles`;
  lista.addEventListener("click", (evento) => {
    //target es el elemento html donde el cursor hace click
    //closest busca sobre el target la referencia a la que se le esta haciendo relación y ejecuta el evento
    const boton = evento.target.closest('[data-action="add-to-cart"]');
    if (!boton) return;
    //dataset.productId hace referencia al boton para agregar productos en las tarjetas del catalogo
    //Indicado cuales son los id de producto que se deben insertar al carrito
    const entrada = lista.querySelector(
      `input[data-product-id = "${boton.dataset.productId}"]`,
    );
    //Hace referencia a el valor que se encuentra al lado del boton, de modo que el sistema sabe cuanto agregar una vez
    //se ejecuta el evento de click
    const cantidadSeleccionada = Number(entrada.value);
    // Consulta el catálogo actual para usar las existencias más recientes.
    const producto = obtenerProductos().find(
      (item) => item.identificacion === boton.dataset.productId,
    );
    // Si retiraron el producto del catálogo, no permite agregarlo.
    if (!producto) {
      mostrarAdvertencia('Este producto ya no está disponible.', 'catalogMessage');
      return;
    }
    if (!Number.isInteger(cantidadSeleccionada) || cantidadSeleccionada < 1)
      return mostrarAdvertencia(
        "Seleccione una cantidad mayor a cero.",
        "catalogMessage",
      );
    //Agrega los productos al carrito de compras
    const carrito = obtenerCarrito();
    //Buscamos cuantas unidades de este producto existen actualmente agregadas al carrito
    const cantidadActual =
      carrito.listaDeProductos.find(
        (item) => item.producto.identificacion === producto.identificacion,
      )?.cantidad || 0;
    //Si existe actualmente el producto agregado, suma la nueva cantidad que se va a agregar
    //Si no hay id del producto (o esta en 0), se agrega la cantidad seleccionada por el usuario
    if (cantidadActual + cantidadSeleccionada > producto.stock)
      return mostrarAdvertencia(
        "La cantidad seleccionada supera el stock disponible",
        "catalogMessage",
      );
    carrito.agregarProducto(producto, cantidadSeleccionada);
    guardarCarrito(carrito);
    entrada.value = "0";
    mostrarAdvertencia(
      "Producto agregado exitosamente al carrito",
      "catalogMessage",
    );
  });
}

// Formateador reutilizable: es-CO usa las convenciones de Colombia (punto para miles).
// .format(precio) devuelve texto para mostrar; no modifica el número usado en los cálculos.
// Se inicializa antes de ejecutar cargarTarjetas(), donde se utiliza para mostrar los precios.
const formatoMoneda = new Intl.NumberFormat("es-CO", {
  style: "currency", // Presenta el valor como dinero e incluye el símbolo de moneda.
  currency: "COP", // Utiliza pesos colombianos.
  maximumFractionDigits: 0, // Muestra pesos sin decimales; redondea solo la presentación.
});
// Muestra el usuario de la sesión y conecta el botón para cerrar sesión.
// Comprueba que los elementos existan porque app.js se carga en varias páginas.
function configurarCabecera() {
  const usuario = usuarioActivo();
  if (!usuario) return;

  const nombre = document.querySelector("#loggedUserName");
  if (nombre) {
    // Escribe el nombre como texto, sin interpretarlo como HTML.
    nombre.textContent = usuario.nombre;
  }

  const botonSalir = document.querySelector("#logoutButton");
  if (botonSalir) {
    botonSalir.addEventListener("click", () => {
      // Elimina solo la sesión activa; conserva los usuarios y los carritos guardados.
      sessionStorage.removeItem(CLAVES.usuarioActivo);
      window.location.href = "index.html";
    });
  }
}

function configurarCarrito() {
    const tabla = document.querySelector('#cartItems');

    // Como app.js se carga en todas las páginas, solo continuamos
    // cuando existe la tabla de carrito.html.
    if (!tabla) return;

    // Elementos donde mostraremos el resumen.
    const contador = document.querySelector('#cartCount');
    const subtotal = document.querySelector('#subtotal');
    const total = document.querySelector('#total');
    const sedeRecogida = document.querySelector('#pickupStore');
    const botonPago = document.querySelector('#checkoutButton');

    // Conserva el mensaje de carrito vacío que ya tiene el HTML.
    const contenidoVacio = tabla.innerHTML;

    // Reutiliza la función existente para mostrar mensajes.
    function mostrarMensaje(texto) {
        mostrarAdvertencia(texto, 'cartMessage');
    }

    // Consulta el producto en el catálogo actual.
    // Su stock podría haber cambiado desde que se agregó al carrito.
    function buscarProductoActual(productoId) {
        return obtenerProductos().find(
            producto => producto.identificacion === productoId
        );
    }

    // Revisa si el carrito puede continuar al pago.
    // Devuelve un mensaje cuando encuentra un problema.
    function validarCarrito(carrito) {
        if (carrito.listaDeProductos.length === 0) {
            return 'Agrega productos antes de continuar al pago.';
        }

        // La sede del registro está guardada como "direccion".
        const usuario = usuarioActivo();
        
        // Valida que el usuario tenga una sede registrada."trim" elimina los espacios en blanco al inicio y al final de la cadena de texto
        if (!usuario?.direccion?.trim()) {
            return 'Tu cuenta no tiene una sede de recogida. Revisa tus datos personales.';
        }
        // for of sirve para recorrer todos los elementos de un arreglo, en este caso el arreglo de productos del carrito
        // "item" es la variable que representa cada elemento del arreglo en cada iteración del bucle
        // "carrito.listaDeProductos" es el arreglo que contiene los productos del carrito
        for (const item of carrito.listaDeProductos) {
            const producto = buscarProductoActual(
                item.producto.identificacion
            );
            // Valida que el producto aún exista en el catálogo y que la cantidad sea válida.
            if (!producto) {//!producto "!" significa "no" o "negación", por lo que "!producto" significa "si no existe el producto"
                return `${item.producto.nombre} ya no está disponible. Elimínalo del carrito.`;
            }
            // Valida que la cantidad sea un número entero y mayor a cero
            if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
                return `Revisa la cantidad de ${item.producto.nombre}.`;
            }
            //valida que la cantidad no supere el stock disponible
            if (item.cantidad > producto.stock) { 
                return `Solo hay ${producto.stock} unidades disponibles de ${producto.nombre}. Ajusta la cantidad o elimina el producto.`;
            }
        }

        // Sin mensaje significa que el carrito es válido.
        return '';
    }

    // Actualiza la tabla, las cantidades, los valores y la sede.
    function mostrarCarrito() {
        // Recupera el carrito guardado del usuario que tiene la sesión iniciada.
        const carrito = obtenerCarrito();
        const items = carrito.listaDeProductos;
        const estaVacio = items.length === 0;// Determina si el carrito está vacío para deshabilitar el botón de pago.
        const usuario = usuarioActivo();

        // Muestra la sede elegida al registrarse.
        // Esta versión utiliza la sede del usuario como tienda de recogida.
        sedeRecogida.textContent =
            usuario?.direccion || 'Sin sede seleccionada';

        // El subtotal es la suma de precio por cantidad.
        const valorSubtotal = carrito.calcularTotal();

        // Cuenta todas las unidades, no solo los productos diferentes.
        const unidades = items.reduce(
            (acumulado, item) => acumulado + item.cantidad,
            0
        );
        //Muestra el número de unidades usando singular o plural
        contador.textContent =
            `${unidades} ${unidades === 1 ? 'producto' : 'productos'}`;
        // Muestra el subtotal y el total con formato de moneda.
        subtotal.textContent = formatoMoneda.format(valorSubtotal);

        // Todos los pedidos se recogen en tienda.
        // No hay costo de domicilio, por eso total y subtotal son iguales.
        total.textContent = formatoMoneda.format(valorSubtotal);

        if (estaVacio) {
            // Sin productos no hay enlace al pago.
            botonPago.removeAttribute('href');

            // Recupera el mensaje original de carrito vacío.
            tabla.innerHTML = contenidoVacio;
            return;
        }

        // Con productos, el enlace puede llevar a pago.html.
        // Antes de navegar también se validará el carrito.
        botonPago.setAttribute('href', 'pago.html');

        // Limpia la tabla antes de mostrar los datos actualizados,
        // para que no queden filas viejas junto a las nuevas.
        tabla.replaceChildren();
        // Recorre los elementos del carrito: cada item contiene un producto y su cantidad.
        // Por ejemplo, 2 Combo CESDE ocupan una sola fila con cantidad 2.
        items.forEach(item => {
            // item contiene producto y cantidad. Aquí obtenemos solo el producto guardado en el carrito.
            const producto = item.producto;
            // Busca ese mismo producto en el catálogo por su identificación para consultar su stock actual.
            const productoActual = buscarProductoActual(
                producto.identificacion
            );

            // Crea una fila vacía (<tr>) para este producto. Se verá cuando la agreguemos a tabla con append.
            const fila = document.createElement('tr');

            // Crea cinco celdas vacías (<td>) para esta fila del producto.
            // Las primeras cuatro mostrarán nombre, precio, cantidad y subtotal.
            // celdaAccion será el espacio para el botón Eliminar; crear la celda no elimina nada.
            const celdaNombre = document.createElement('td');
            const celdaPrecio = document.createElement('td');
            const celdaCantidad = document.createElement('td');
            const celdaSubtotal = document.createElement('td');
            const celdaAccion = document.createElement('td');

            // Escribe el nombre del producto dentro de su celda. textContent lo muestra como texto, sin interpretarlo como HTML.
            celdaNombre.textContent = producto.nombre;
            // Escribe el precio de una unidad con formato de pesos; por ejemplo, 8550 se muestra como $8.550.
            celdaPrecio.textContent =
                formatoMoneda.format(producto.precio);
            // Muestra el subtotal de esta fila: por ejemplo, 2 combos de 8550 suman 17100. Luego aplica formato de moneda.
            celdaSubtotal.textContent =
                formatoMoneda.format(producto.precio * item.cantidad);

            // Crea el campo donde el usuario verá y podrá cambiar cuántas unidades quiere de este producto.
            const entradaCantidad = document.createElement('input');
            // type configura un campo numérico; min indica que la cantidad válida empieza en 1.
            // step hace que las flechas del campo aumenten o disminuyan la cantidad de una en una.
            entradaCantidad.type = 'number';
            entradaCantidad.min = '1';
            entradaCantidad.step = '1';
            // El máximo válido es el stock del catálogo. String convierte ese número a texto para el campo HTML.
            entradaCantidad.max = String(
                // Ternario: si se encontró el producto, usa su stock; si no se encontró, usa 0. Luego también validamos la cantidad con JavaScript.
                productoActual ? productoActual.stock : 0 
            );
            // Muestra en el campo la cantidad que ya está guardada en el carrito.
            entradaCantidad.value = String(item.cantidad);

            // dataset.productId crea data-product-id en el HTML y guarda el identificador para saber qué producto cambiar.
            entradaCantidad.dataset.productId =
                producto.identificacion;
            // Guarda data-action="change-quantity" en el campo. Más abajo usamos esa etiqueta para reconocer qué cambio atender.
            entradaCantidad.dataset.action = 'change-quantity';


            // Crea un contenedor para el campo y le asigna la clase CSS quantity-control, que define su apariencia.
            const controlCantidad = document.createElement('div');
            controlCantidad.className = 'quantity-control';
            // append coloca un elemento dentro de otro: campo de cantidad → div de estilo → celdaCantidad.
            controlCantidad.append(entradaCantidad);
            celdaCantidad.append(controlCantidad);

            // Crea el botón que pondremos en la celda de acciones.
// El evento click definido más abajo se encarga de eliminar el producto.
            const botonEliminar = document.createElement('button');
            // Es un botón de acción: no debe enviar un formulario.
            botonEliminar.type = 'button';
            // Asigna las clases CSS que dan estilo al botón; no cambian los datos del carrito.
            botonEliminar.className =
                'button button--ghost button--small';
            // Escribe Eliminar como texto visible dentro del botón.
            botonEliminar.textContent = 'Eliminar';
            // Guarda dos datos en el botón: la acción que representa y la identificación del producto.
            // Estas etiquetas no eliminan nada todavía; el evento click las leerá cuando el usuario pulse el botón.
            botonEliminar.dataset.action = 'remove-product';
            botonEliminar.dataset.productId =
                producto.identificacion;


            // Coloca el botón Eliminar en la última celda. Esto solo organiza la fila; aún no quita productos del carrito.
            celdaAccion.append(botonEliminar);

            // Introduce las cinco celdas en la fila, en el mismo orden que los encabezados del HTML.
            fila.append(
                celdaNombre,
                celdaPrecio,
                celdaCantidad,
                celdaSubtotal,
                celdaAccion
            );

            // Agrega la fila al cuerpo de la tabla: ahora sus elementos aparecen en la página.
            tabla.append(fila);
        });
    }

    // Conecta la acción que se ejecutará cuando el usuario cambie una cantidad y confirme el cambio, por ejemplo al salir del campo.
    // Escuchamos desde la tabla porque los eventos de sus campos llegan a ella.
    // Así no hay que volver a conectar cada campo cuando mostrarCarrito reconstruye las filas.
    tabla.addEventListener('change', evento => {
        // evento.target indica en qué elemento ocurrió el cambio.
        // closest busca el propio elemento o uno de sus contenedores con data-action="change-quantity".
        const entrada = evento.target.closest(
            '[data-action="change-quantity"]'
        );

        // Si el cambio no corresponde a un campo etiquetado como change-quantity, termina esta función.
        if (!entrada) return;

        // Recupera la identificación guardada en data-product-id para localizar el producto correcto.
        const productoId = entrada.dataset.productId;
        // value viene como texto; Number lo convierte a número para validar y calcular.
        const cantidad = Number(entrada.value);
        // Consulta otra vez el catálogo para comprobar que el producto exista y conocer su stock.
        const producto = buscarProductoActual(productoId);

        if (
            // Rechaza si el campo está vacío O la cantidad no es entera O es menor que 1. Cada || significa O.
            entrada.value.trim() === '' ||
            // Number.isInteger comprueba si es entero; ! niega la comprobación, por lo que detecta cantidades no enteras.
            !Number.isInteger(cantidad) ||
            // También rechaza cero y números negativos: para quitar el producto se utiliza el botón Eliminar.
            cantidad < 1
        ) {
            mostrarMensaje(
                'Ingresa una cantidad entera mayor que cero. Para quitar el producto, usa Eliminar.'
            );

            // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
            mostrarCarrito();
            return;
        }

        // Si el catálogo ya no contiene el producto, avisa y restaura la vista sin guardar la cantidad nueva.
        if (!producto) {
            mostrarMensaje(
                'Este producto ya no está disponible. Elimínalo del carrito.'
            );
            // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
            mostrarCarrito();
            return;
        }

        // Comprueba el stock con JavaScript: max por sí solo no impide que alguien escriba una cantidad mayor.
        if (cantidad > producto.stock) {
            mostrarMensaje(
                `Solo hay ${producto.stock} unidades disponibles de ${producto.nombre}.`
            );
            // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
            mostrarCarrito();
            return;
        }

        // Recupera el carrito guardado del usuario que tiene la sesión iniciada.
        const carrito = obtenerCarrito();
        // El método de modelos.js cambia la cantidad del producto, recalcula el total y guarda el carrito en localStorage.
        carrito.actualizarCantidadProducto(productoId, cantidad);

        // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
        mostrarCarrito();
        // Informa que el cambio se guardó. mostrarCarrito, arriba, ya reconstruyó la tabla y actualizó los totales.
        mostrarMensaje('Cantidad actualizada correctamente.');
    });

    // Aquí se conecta la acción de eliminar, que solo se ejecuta cuando llega un clic.
    // Una sola función en la tabla atiende todos los botones Eliminar, incluso después de reconstruir las filas.
    tabla.addEventListener('click', evento => {
        // Busca el botón de eliminar aunque el clic ocurra sobre un elemento dentro del botón.
        const boton = evento.target.closest(
            '[data-action="remove-product"]'
        );

        // Si el clic fue en otra parte de la tabla, termina sin eliminar ningún producto.
        if (!boton) return;

        // Recupera el carrito guardado del usuario que tiene la sesión iniciada.
        const carrito = obtenerCarrito();

        // Aquí sí se elimina el producto del carrito, con todas sus unidades.
        // Por ejemplo, si había 3 combos, se quita la entrada completa; no se resta solo uno.
        // El método de modelos.js también recalcula el total y guarda el carrito en localStorage.
        carrito.eliminarProducto(boton.dataset.productId);

        // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
        mostrarCarrito();
        // Después de volver a mostrar el carrito, confirma al usuario que se eliminó el producto.
        mostrarMensaje('Producto eliminado del carrito.');
    });

    // Al pulsar Continuar al pago, revisa los datos antes de permitir que el enlace abra pago.html.
    botonPago.addEventListener('click', evento => {
        // Recupera el carrito guardado del usuario que tiene la sesión iniciada.
        const carrito = obtenerCarrito();
        // validarCarrito devuelve un mensaje si hay un problema, o un texto vacío si todas sus comprobaciones pasan.
        const error = validarCarrito(carrito);

        // Si error contiene un mensaje, impide ir al pago y muestra ese mensaje.
        // Si contiene '', no entra al if y el enlace puede abrir pago.html normalmente.
        if (error) {
            // Cancela la navegación del enlace para que el usuario corrija el problema antes de ir al pago.
            evento.preventDefault();
            // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
            mostrarCarrito();
            // Muestra el motivo concreto por el que no puede continuar al pago.
            mostrarMensaje(error);
        }

    });

    // Para localStorage, storage avisa de cambios hechos en otra pestaña del mismo sitio, no de los realizados en esta pestaña.
    // Si otra pestaña de este mismo sitio cambia los datos guardados,
    // recibe el aviso para comprobar si debemos actualizar este carrito.
    window.addEventListener('storage', evento => {
        const usuario = usuarioActivo();

        // Sin usuario activo no hay un carrito personal que actualizar; termina este evento.
        if (!usuario) return;

        // Usa el id del usuario para reconocer su carrito guardado; por ejemplo, el usuario 123 tiene la clave carrito_123.
        const claveCarrito = `carrito_${usuario.id}`;

        if (
            // Actualiza si cambió el carrito de este usuario, la lista de productos, o se vació todo localStorage (key es null).
            evento.key === claveCarrito ||
            evento.key === CLAVES.productos ||
            evento.key === null
        ) {
            // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
            mostrarCarrito();
        }
    });

    // Lee el carrito guardado y vuelve a dibujar las filas, cantidades y totales en pantalla.
    mostrarCarrito();
}

function realizarPago() {
  //Obtenemos usuatio activo, el carrito asignado a ese cliente
  const usuario = usuarioActivo();
  if (!usuario) return;
  const carrito = obtenerCarrito();
  //Guardamos el nombre del usuario activo para mostrarlo en un label para referenciar la compra
  const nombre = document.querySelector("#paymentCustomerName");
  if (nombre) nombre.textContent = usuario.nombre;
  //Guardamos el formulario que contiene todos los elementos en una variable
  const formulario = document.querySelector("#paymentForm");
  //Validamos que el dformulario tenga información y que el carrito de compras no este vacio
  if (!formulario) return;
  if(!carrito.listaDeProductos.length){
    //Si el carrito esta vacio, regresa a la pagina del carrito
    window.location.href = 'carrito.html';
    return;
  }
  //Creamos un elemento HTML para mostrar el detalle de lo que se va a pagar
  let resumen = document.querySelector('#paymentSummary');
  if(!resumen){
    resumen = document.createElement('section');
    resumen.id = 'paymentSummary';
    resumen.className = 'payment-panel';
    //inserta un elemento como "hijo"
    formulario.prepend(resumen);
  }
    //Insertamos el elemento HTML
    resumen.innerHTML = `<h2>Detalle de compra</h2>${carrito.listaDeProductos.map((item) =>`<p class="summary-line"><span>${item.producto.nombre} x ${item.cantidad}</span><strong>${formatoMoneda.format(item.producto.precio * item.cantidad)}</strong></p>`).join('')}<div class="summary-total"><span>Total</span><strong>${formatoMoneda.format(carrito.calcularTotal())}</strong></div>`;
    const opciones = document.querySelectorAll('input[name="method"]');
    const camposTarjeta = document.querySelector('#cardFields');
    const cambiarMetodo = () =>{
        const esTarjeta = document.querySelector('input[name="method"]:checked')?.value === 'tarjeta';
        //oculta los campos de la tarjeta si el metodo seleccionado no es tarjeta
        if (!camposTarjeta) return;
        camposTarjeta.hidden = !esTarjeta;
        camposTarjeta.querySelectorAll('input').forEach((input) =>{input.required = esTarjeta;});
    };
    //añadimos un event listener para cuando se haga un cambio en el metodo de pago este ejecute la funcion
    // y despliegue los campos necesario dependiendo de la opción
    opciones.forEach((opcion) => opcion.addEventListener('change', cambiarMetodo));
    cambiarMetodo();
    //Añadimos in listener para cuando se haga click en el boton que procesa la compra
    formulario.addEventListener('submit', (evento) => {
        evento.preventDefault();
        //Si el formulario no es valido, repota los errores que encuentra
        if(!formulario.checkValidity()) return formulario.reportValidity();
        //Guardamos en una constante los productos que existen
        const productos = obtenerProductos();
        //some valida los productos y valida si alguno tiene un error
        const stockInsuficiente = carrito.listaDeProductos.some((item) => {
            //find busca por cada producto en el carrito (item), el mismo item en la base de datos (productos)
            const producto = productos.find((actual) => actual.identificacion === item.producto.identificacion);
            //Determina si el stock es insuficiente si:
            //el producto ya no existe en la BD o el usuario compra una cantidad mayor a la existente en stock
            return !producto || item.cantidad > producto.stock; 
        });
        if(stockInsuficiente){
            mostrarAdvertencia('Uno de los productos ya no tiene stock suficiente.', 'paymentMessage');
            return;
        }
        //Toma los productos seleccinados por el usuario y busca el mismo ID en la BD para controlar el inventario
        carrito.listaDeProductos.forEach((item) => {
            const producto = productos.find((actual) => actual.identificacion === item.producto.identificacion);
            producto.actualizarStock(item.cantidad)
        });
        //Guarda el metodo seleccionado buscando en HTML un input con atributo method y que este seleccionado
        const metodo = document.querySelector('input[name="method"]:checked').value;
        //Creamos un nuebo objeto de la clase orden, de modo que podamos guardar la información que sera mostrada
        //una vez el pago sea procesado
        const orden = new Orden(usuario.id, carrito.listaDeProductos, carrito.calcularTotal(), new MetodoDePago(metodo));
        //Traemos las ordenes que ya existan y las metemos a un arreglo para guardar la nueva orden
        const ordenes = leer(CLAVES.ordenes, []);
        //"empujamos" la nueva orden dentro de la lista de ordenes
        ordenes.push(orden);
        //con map, recorremos el arreglo de productos para guardar y actualizar el stock de los productos comprados
        guardar(CLAVES.productos, productos.map((producto) => producto.mostrarDatos()));
        //Guardamos esta orden procesada con las demas ordenes ya existentes
        guardar(CLAVES.ordenes, ordenes);
        //Guardamos la ultima orden procesada para ser mostrada en la orden
        guardar(CLAVES.ultimaOrden, orden);
        //Limpiamos el carrito de compras
        guardar(`carrito_${usuario.id}`, []);
        window.location.href = 'orden.html';
    })
}

//Falta por crear la funcionalidad del boton para el historial de las ordenes y el evento que se activa al dar click sobre
//el boton del historial
//Crear la clase que da funcionalidad al boton de "Finalizar compra"

//localStorage.clear();

if (protegerPaginas()) {
  configurarCabecera();
  configurarLogin();
  configurarRegistro();
  cargarTarjetas();
  configurarCarrito();
  realizarPago();
}
