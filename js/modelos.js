export default class Producto{
    #identificacion;
    #nombre;
    #descripcion;
    #precio;
    #stock;

    constructor(identificacion, nombre, descripcion, precio, stock){
        this.#identificacion = identificacion;
        this.#nombre = nombre;
        this.#descripcion = descripcion;
        this.#precio = precio;
        this.#stock = stock;
    }

    get identificacion(){return this.#identificacion}
    get nombre(){return this.#nombre}
    get descripcion(){return this.#descripcion}
    get precio(){return this.#precio}
    get stock(){return this.#stock}

    mostrarDatos(){
        return{
            identificacion: this.#identificacion,
            nombre: this.#nombre,
            descripcion: this.#descripcion,
            precio: this.#precio,
            stock: this.#stock
        }
    }
}


export class Desayuno extends Producto {
    constructor(identificacion, nombre, descripcion, precio, stock,huevosPreparados,tipoDePan,tipoDeLeche, incluyeFruta){
        super(identificacion, nombre, descripcion, precio, stock);

        this.huevosPreparados = huevosPreparados;
        this.tipoDePan        = tipoDePan;
        this.tipoDeLeche      = tipoDeLeche;
        this.incluyeFruta     = incluyeFruta;

    }
}

export class Almuerzo extends Producto {
    constructor(identificacion, nombre, descripcion, precio, stock, tipoDeProteina, terminoDeCarne, guarnicion, sopaDelDia){
        super(identificacion, nombre, descripcion, precio, stock);
        this.tipoDeProteina = tipoDeProteina;
        this.terminoDeCarne = terminoDeCarne;
        this.guarnicion     = guarnicion;
        this.sopaDelDia     = sopaDelDia;
    }
}


export class Cena extends Producto{
    constructor(identificacion, nombre, descripcion, precio, stock, porcionLigera, paraCompartir, tipoDePreparacion){
    super(identificacion, nombre, descripcion, precio, stock);
    this.porcionLigera = porcionLigera;
    this.paraCompartir = paraCompartir;
    this.tipoDePreparacion = tipoDePreparacion;
    }    
}

export class CarroDeCompras{
    constructor(carroDeComprasId, listaDeProductos, total){
        this.carroDeComprasId = carroDeComprasId;
        this.listaDeProductos = JSON.parse(localStorage.getItem("carroDeCompras")) || [];
        this.total = total
    }
}
    agregarProducto(producto, cantidad) {
    const productoExistente = this.listaDeProductos.find(
        p => p.producto.identificacion === producto.identificacion
    );

    if (productoExistente) {
        productoExistente.cantidad += cantidad;
    } else {
        this.listaDeProductos.push({ producto, cantidad });
    }
}

    eliminarProducto(productoId) {
        this.listaDeProductos = this.listaDeProductos.filter(p => p.producto.identificacion !== productoId);
        this.saveToLocalStorage();
    }

    actualizarCantidadProducto(productoId, cantidad){
        const item = this.listaDeProductos.find(p => p.producto.identificacion === productoId);
        if (item) {
            item.cantidad = paseInt(cantidad);
            if (item.cantidad <= 0) {
                this.eliminarProducto(productoId);
            }                
                else {
                    this.saveToLocalStorage();
            }
        }
    }

    calcularTotal() {
        this.total = this.listaDeProductos.reduce((acc, item) => +acc + item.producto.precio * item.cantidad, 0);
        return this.total;
    }

    saveToLocalStorage() {
        localStorage.setItem("carroDeCompras", JSON.stringify(this.listaDeProductos));
    }

export class metodoDePago{
    constructor(metodoDePagoId, metodoDePago, carroDeComprasId){
        this.metodoDePagoId = metodoDePagoId;
        this.metodoDePago = metodoDePago;
        this.carroDeComprasId = carroDeComprasId;
    }

    cambiarEstadoDePago(nuevoEstado){
        this.estadoDePago = nuevoEstado;
    }
}

export class Orden {
    constructor(ordenId, clienteId, listaDeProductos,total,dia, estado, pagoId){
        this.ordenId = ordenId;
        this.clienteId = clienteId;
        this.listaDeProductos = listaDeProductos;
        this.total = total;
        this.dia = dia;
        this.estado = estado;
        this.pagoId = pagoId;
    }
    generarOrden() {
        const orden = {
            ordenId: this.ordenId,
            clienteId: this.clienteId,
        }
    }
}



export class Cliente {
    constructor(id, nombre, correo, direccion, contrasena, nombreDeUsuario) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.direccion = direccion;
        this.contrasena = contrasena;
        this.nombreDeUsuario = nombreDeUsuario;
    }
    registrarse() {

        //Vericamos que lo ingresado coincida o no con lo que existe en el loca storage
        const clienteAlmacenado = localStorage.getItem('coffeeCliente');
        //con JSON.parse convetimos el texto guardado en un arreglo
        //Si encuentra que el cliente ingresado esta almacenado, lo convierte en un arreglo. Si no hay nada
        //Crea un arreglo vacio
        const cliente = clienteAlmacenado ? JSON.paseInt(clienteAlmacenado) : [];

        //some valida si al menos un elemento dentro del arreglo cumple con una condición especifica
        const clienteExistente = cliente.some((cliente)  =>
            cliente.nombreDeUsuario.toLowerCase() == this.nombreDeUsuario.toLowerCase() ||
            cliente.correo.toLowerCase() === this.correo.toLowerCase()
        );

        if(clienteExistente) {
            return false;
        }

        cliente.push(this);
        //JSON.stringify covierte el arreglo nuevamente en texto
        localStorage.setItem('coffeeCliente', JSON.stringify(cliente));

        return true;
    }

    iniciarSesion() {
    }

    modificar() {
    }

}

