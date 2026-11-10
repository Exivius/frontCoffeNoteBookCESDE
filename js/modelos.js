// Clases del dominio que representan productos, carrito, órdenes y perfiles.
export default class Producto {
    // Los campos privados (#) solo se pueden modificar desde la clase; los getters permiten consultarlos.
    #identificacion;
    #nombre;
    #descripcion;
    #precio;
    #stock;

    constructor(identificacion, nombre, descripcion, precio, stock) {
        this.#identificacion = identificacion;
        this.#nombre = nombre;
        this.#descripcion = descripcion;
        this.#precio = precio;
        this.#stock = stock;
    }

    get identificacion() { return this.#identificacion; }
    get nombre() { return this.#nombre; }
    get descripcion() { return this.#descripcion; }
    get precio() { return this.#precio; }
    get stock() { return this.#stock; }

    mostrarDatos() {
        return {
            identificacion: this.#identificacion,
            nombre: this.#nombre,
            descripcion: this.#descripcion,
            precio: this.#precio,
            stock: this.#stock
        };
    }

    toJSON() {
        return this.mostrarDatos();
    }

    actualizarStock(cantidad){
        //El stock nunca debe quedar en un numero negativo.
        //Validamos que el maximo permitido sea 0 y restamos del stock actual
        this.#stock = Math.max(0, this.#stock - cantidad);
        return this.#stock;
    }
}

// Cada categoría hereda identificación, nombre, precio y stock, y añade sus datos específicos.
export class Desayuno extends Producto {
    constructor(identificacion, nombre, descripcion, precio, stock, huevosPreparados, tipoDePan, tipoDeLeche, incluyeFruta) {
        super(identificacion, nombre, descripcion, precio, stock);
        this.huevosPreparados = huevosPreparados;
        this.tipoDePan = tipoDePan;
        this.tipoDeLeche = tipoDeLeche;
        this.incluyeFruta = incluyeFruta;
    }

    mostrarDatos() {
        return {
            ...super.mostrarDatos(),
            categoria: 'Desayuno',
            huevosPreparados: this.huevosPreparados,
            tipoDePan: this.tipoDePan,
            tipoDeLeche: this.tipoDeLeche,
            incluyeFruta: this.incluyeFruta
        };
    }
}

export class Almuerzo extends Producto {
    constructor(identificacion, nombre, descripcion, precio, stock, tipoDeProteina, terminoDeCarne, guarnicion, sopaDelDia) {
        super(identificacion, nombre, descripcion, precio, stock);
        this.tipoDeProteina = tipoDeProteina;
        this.terminoDeCarne = terminoDeCarne;
        this.guarnicion = guarnicion;
        this.sopaDelDia = sopaDelDia;
    }

    mostrarDatos() {
        return {
            ...super.mostrarDatos(),
            categoria: 'Almuerzo',
            tipoDeProteina: this.tipoDeProteina,
            terminoDeCarne: this.terminoDeCarne,
            guarnicion: this.guarnicion,
            sopaDelDia: this.sopaDelDia
        };
    }
}

export class Cena extends Producto {
    constructor(identificacion, nombre, descripcion, precio, stock, porcionLigera, paraCompartir, tipoDePreparacion) {
        super(identificacion, nombre, descripcion, precio, stock);
        this.porcionLigera = porcionLigera;
        this.paraCompartir = paraCompartir;
        this.tipoDePreparacion = tipoDePreparacion;
    }

    mostrarDatos() {
        return {
            ...super.mostrarDatos(),
            categoria: 'Cena',
            porcionLigera: this.porcionLigera,
            paraCompartir: this.paraCompartir,
            tipoDePreparacion: this.tipoDePreparacion
        };
    }
}

export class CarroDeCompras {
    // El carrito agrupa productos y cantidades; su total se calcula a partir de esos datos.
    constructor(carroDeComprasId, listaDeProductos = null, total = 0) {
        this.carroDeComprasId = carroDeComprasId;
        this.listaDeProductos = listaDeProductos ??
            JSON.parse(localStorage.getItem(this.carroDeComprasId) || "[]");
        this.total = total;
        this.total = this.calcularTotal();
    }

    agregarProducto(producto, cantidad) {
        if (!producto || cantidad <= 0) return;

        const productoExistente = this.listaDeProductos.find(
            p => p.producto.identificacion === producto.identificacion
        );

        if (productoExistente) {
            productoExistente.cantidad += cantidad;
        } else {
            this.listaDeProductos.push({ producto, cantidad });
        }

        this.saveToLocalStorage();
    }

    eliminarProducto(productoId) {
        this.listaDeProductos = this.listaDeProductos.filter(
            p => p.producto.identificacion !== productoId
        );
        this.saveToLocalStorage();
    }

    actualizarCantidadProducto(productoId, cantidad) {
        const item = this.listaDeProductos.find(
            p => p.producto.identificacion === productoId
        );

        if (!item) return;

        item.cantidad = parseInt(cantidad, 10);

        if (item.cantidad <= 0) {
            this.eliminarProducto(productoId);
        } else {
            this.saveToLocalStorage();
        }
    }

    calcularTotal() {
        // reduce recorre las líneas y acumula precio × cantidad para obtener el total del carrito.
        this.total = this.listaDeProductos.reduce(
            (acc, item) => acc + item.producto.precio * item.cantidad,
            0
        );
        return this.total;
    }

    saveToLocalStorage() {
        this.total = this.calcularTotal();
        localStorage.setItem(this.carroDeComprasId, JSON.stringify(this.listaDeProductos));
    }
}

export class MetodoDePago {
    // Modelo descriptivo del método y estado; el flujo web no procesa cobros reales.
    constructor(metodoDePagoId, metodoDePago, carroDeComprasId) {
        this.metodoDePagoId = metodoDePagoId;
        this.metodoDePago = metodoDePago;
        this.carroDeComprasId = carroDeComprasId;
        this.estadoDePago = "pendiente";
    }

    cambiarEstadoDePago(nuevoEstado) {
        this.estadoDePago = nuevoEstado;
    }
}

export class Orden {
    // Representa una compra confirmada con su cliente, artículos, total y fecha.
    constructor(clienteId, listaDeProductos, total, dia, estado, pagoId) {
        this.ordenId = `ORD-${Date.now()}`;
        this.clienteId = clienteId;
        this.listaDeProductos = listaDeProductos;
        this.total = total;
        this.dia = dia;
        this.estado = estado;
        this.pagoId = pagoId;
    }

    generarOrden() {
        return {
            ordenId: this.ordenId,
            clienteId: this.clienteId,
            listaDeProductos: this.listaDeProductos,
            total: this.total,
            dia: this.dia,
            estado: this.estado,
            pagoId: this.pagoId
        };
    }
}

export class Cliente {
    // Modelo legado: no implementa el acceso; el flujo actual delega las cuentas en Firebase Authentication.
    constructor({id = null, nombre, correo, direccion, contrasena, nombreDeUsuario}) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.direccion = direccion;
        this.contrasena = contrasena;
        this.nombreDeUsuario = nombreDeUsuario;
    }

    // Registro, autenticación y cambios de perfil se realizan en cloud.js.
    // Este modelo ya no persiste contraseñas ni cuentas en localStorage.
}
