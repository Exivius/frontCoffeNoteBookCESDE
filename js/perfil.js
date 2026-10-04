// actualizamos los datos personales usando la clase cliente

import {Cliente} from './modelos.js'

export default class ControladorPerfil{
    constructor(){
        this.formulario = document.querySelector('#profileForm');
        this.mensaje = document.querySelector('#profileMessage');
        //sesion activa se aloja en session Storage creada desde configurar Login de app.js
        this.session = JSON.parse(sessionStorage.getItem('usuarioActual') || 'null');
    }

    iniciar(){
        if(!this.formulario || !this.sesion) 
            return;
        this.#llenarFormulario()
        this.formulario.addEventListener('submit' , (evento) => this.#guardar(evento));
        
    } 

    #llenarFormulario(){
        const campos = this.formulario.elements;
        campos.name.value = this.sesion.nombre ?? '';
        campos.userName.value = this.sesion.nombreDeUsuario ?? '';
        campos.email.value = this.sesion.correo ?? '';
        campos.address.value = this.sesion.direccion ?? '';

    }

    #validar(cliente){
        if (!cliente.nombre || !cliente.nombreDeUsuario || !cliente.correo || !cliente.direccion){
            return 'por favor complete los campos';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo)) {
        // cadene especial sirve como plantilla de control, molde que el codigo usa para validar que el correo encaje perfectamente
            return 'El correo electrónico no es válido.';
        }
        return null;
    }

    #guardar(evento){
        evento.preventDefault();
        const campos = this.formulario.elements;
        //este evento aplica para actualizar contraseña, usuario debe generar nueva contraseña, de lo contrario se mantendra la anterior
        const cliente = new Cliente({
            id: this.sesion.id,
            nombre: campos.name.value.trim(),
            correo: campos.email.value.trim().toLowerCase(),
            direccion: campos.address.value,
            nombreDeUsuario: campos.userName.value.trim()
        });

        const error = this.#validar(cliente);
        if (error)
            return this.#mostrar(error, true);

        if (cliente.datosRepetidos()){
            return this.#mostrar('correo o nombre de usuario ya registrados', true);

        }

        if(!cliente.modificar()){
            return this.#mostrar('los cambios no se puedieron guardar', true);

        }

        // Lee la lista de usuarios registrados.
        const usuarios = JSON.parse(
    localStorage.getItem('usuarios') || '[]'
    );
 
    // some() devuelve true si encuentra al menos una coincidencia.
        const datosRepetidos = usuarios.some(usuario =>
    // Excluye al usuario que está editando su propio perfil.
        usuario.id !== cliente.id &&(
        // Comprueba si otro usuario tiene el mismo correo...
        usuario.correo.toLowerCase() === cliente.correo.toLowerCase() ||
 
        // ...o el mismo nombre de usuario.
        usuario.nombreDeUsuario.toLowerCase() ===
            cliente.nombreDeUsuario.toLowerCase()
    )
);
 
// Si encuentra una coincidencia, muestra el error y no guarda.
if (datosRepetidos) {
    this.#mostrar(
        'El correo o nombre de usuario ya están registrados.',
        true
    );
    return;

        this.sesion = JSON.parse(sessionStorage.getItem('usuarioActual'));
        const cabecera = document.querySelector('#loggedUserName');

        if (cabecera) cabecera.textContent = this.session.nombre;
        this.#mostrar('los datos se actualizaron correctamente', false);

    }

    #mostrar(texto, esError){
        this.mensaje.textContent = texto;
        this.mensaje.classList.toggle('form-messahe-error', esError);
    }

}
}

// this.mensaje.classList.toggle modifica clases del contenedor de CSS cambiando de color textos