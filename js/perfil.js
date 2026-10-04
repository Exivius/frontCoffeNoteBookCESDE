// actualizamos los datos personales usando la clase cliente

import {cliente} from './modelos.js'

export default class ControladorPerfil{
    constructor(){
        this.formulario = document.querySelector('profileForm');
        this.mensaje = document.querySelector('profileMessage');
        //sesion activa se aloja en session Storage creada desde configurar Login de app.js
        this.session = JSON.parse(sessionStorage.getItem('usuarioActual') || 'null');
    }

    iniciar(){
        if(!this.formulario || !this.session) 
            return;
        this.#llenarFormulario()
        this.formulario.addEventListener('submit' , (evento) => this.#guardar(evento));
        
    } 

    #llenarFormulario(){
        const campos = this.formulario.elementos;
        campos.name.value = this.session.nombre ?? '';
        campos.userName.value = this.sesion.nombreDeUsuario ?? '';
        campos.email.value = this.sesion.correo ?? '';
        campos.address.value = this.sesion.direccion ?? '';

    }

    #validar(cliente){
        if (!cliente.nombre || !cliente.nombreDeUsuario || !cliente.correo || !cliente.direccion){
            return message 'por favor complete los campos';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo)) {

            // cadene especial sirve como plantilla de control, molde que el codigo usa para validar que el correo encaje perfectamente
            return 'El correo electrónico no es válido.';
        }
        return null;
    }

    #guardar(evento){
        evento.preventDefault();
        const campos = this.formulario.elementos;
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
            return this.#,mostrar(error, true);

        if (cliente.datosRepetidos()){
            return this.#mostrar('correo o nombre de usuario ya registrados', true);

        }

        if(!cliente.modificar()){
            return this.#mostrar('los cambios no se puedieron guardar', true);

        }

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

// this.mensaje.classList.toggle modifica clases del contenedor de CSS cambiando de color textos