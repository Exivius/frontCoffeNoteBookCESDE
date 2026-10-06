Nombre y Rol en Scrum

* Roberto Cruz: Product Owner (PO)
* Felipe Correa Rivera: Scrum Master (SM)
* Emanuel Pino: Desarrollador (Dev Team)


# Historias de Usuario

## *Epica 1: Creación del login y gestión de acceso*
### *Feacture 1: Gestión de identidad y Autenticación*

#### **US-01**: Como estudiante de CESDE, quiero registrarme utilizando mi correo electrónico o usuario registrado,para crear mi cuenta rápidamente y acceder a los servicios de compra.
##### Criterios de aceptación:
1. El usuario puede ingresar al modulo de registro
2. El sistema solicita un correo valido
3. El sistema muestra un mensaje de confirmación cuando el registro fue exitoso
4. El usuario se crea en la base de datos
##### Tareas:
1. Debe existir un link con la leyenda "crear usuario"
2. Este link debe llevar al usuario a una pagina de registro
3. La pagina debera contener cuadros de texto para el nombre, usuario, correo, sede y contraseña
4. La pagina debera contener un boton para confirmar el registro
5. La pagina debera contener un link para regresar al login
6. La parte derecha de la pantalla debera ser una parte estatica, con un mensaje tipo slogan e imagen de refrencia a cafeteria

#### **US-01.1:** Como usuario, quiero poder iniciar sesión en el sistema con mis credenciales, para acceder a la plataforma.
##### Criterios de aceptación:
1. El usuario puede ingresar al login de la aplicación
2. El sistema valida que el correo exista
3. El sistema valida que la contraseña sea correcta
4. El sistema muestra un error al usuario si al loguearse, no coindicen los datos con los guardados en las bases de datos
5. El sistema valida un maximo de 3 intentos permitidos para ingresar la contraseña
##### Tareas:
1.  Implementar un modulo visual con los campos necesarios para que el usuario ingrese un usuario y contraseña registrados
2. Debe crearse un boton el cual al ser activado, valida la información ingresada por el usuario en los campos de texto
3. Debe de existir un link que dirija al usuario a la pagina de registro en caso de que no exista tal usuario creado en el sistema
4. La parte derecha de la pantalla debera ser una parte estatica, con un mensaje tipo slogan e imagen de refrencia a cafeteria

### *Feacture 2: Administración de Perfiles y Roles*

#### **US-02:** Como usuario de la aplicación, quiero modificar los datos de mi perfil y actualizarlos en caso de ser necesario teniendo la opción desde la plataforma. 
##### Criterios de aceptación:
1. El usuario podra hacer click en el nombre linkeado en la parte superior derecha al lado del boton cerrar sesión
2. Este link lo llevara a un formulario donde podra actualizar sus datos.
3. el formulario contendra dos botones: Cancelar para regresar al catalogo y guardar para guardar los cambios
4. El formulario se mostrara prellenado al usuario y este modificara los campos que considere necesarios.
5. Los campos de texto deben ser editables y con validaciones dependiendo del tipo de información que se le solicite al usuario
##### Tareas:
1. Prellenado del formulario con los datos correspondientes a la sesion activa
2. Boton guardar cambios hace un update a la información en base de datos
3. Boton cancelar debe regresar a la pagina del catalogo


## **Épica 2: Consulta de productos y portal del sitio**

#### **US-03:** Como estudiante de CESDE, quiero ver un menú de productos, para conocer los artículos que están disponibles.
##### Criterios de aceptación:
1. Se listan los productos del local con su nombre, precio y disponibilidad.
2. Si un producto no tiene stock, aparece como "Agotado" y no se puede añadir.
3. La pagina permitira hacer srwoll up/down si los productos superan el numero permitido de acuerdo al tamaño de la pantalla
##### Tareas:
1. Front se encargara de realizar la interfaz visual con la que un cliente podra interactuar con el sistema.
2. Debera existir un portal generico el cual se alimentara de la información estructurada de la base de datos. Fron se encargara de la maquetacion para que esta tenga los espacios para cargar cada uno de los productos que se ofertan.
#### **US-4:** Como estudiante de CESDE, quiero visualizar el detalle de cada producto, para asegurarme de sus características antes de agregarlo al pedido.
  #### Criterios de aceptación:
1. El usuario sera capaz de visualizar la descripción ubicada en la parte de abajo de la imagen de referencia del producto
2. La descripción debera contener los ingredientes que componen el producto, el precio a pagar, los gramajes por porcion.
  #### Tareas:
1. Front Se encargara de que los modulos del menu tengan estilos que permitan tener la correcta visualizacón del producto, separado de su nombre y descripción.
2. Los contenedores de la información del producto deberan tener separación adecuada, de modo que la imagen no quede pegada de la descripción, ni la descripción de los ingredientes que componen el producto
3. Cada tarjeta debera llenarse con la información correspondiente al producto mostrado en imagen de acuerdo a la información guardada en base de datos.

#### **US-5:** Descripción: Como estudiante de CESDE, quiero seleccionar los productos y las cantidades que deseo comprar, para ir armando mi pedido según mis necesidades.
#### Criterios de aceptación:
1. El estudiante debera poder usar los botones o campos numeros para aumentar o disminuir la cantidad del producto
2. Cada producto debera tener un boton para agregar el producto al carrito de compras
#### Tareas:
1. Front debera agregar los botones para aumentar o disminuir la cantidad el producto
2.Front se encargara de que esta cantidad del producto sera visible en un campo de texto y debera actualizarse cada que el cliente de click sobre los botones designados para aumentar o disminuir la cantidad del producto.
3. El campo donde se visualiza la cantidad del producto tambien debera ser modificable y que el cliente pueda ingresar un numero por teclado
4. Debera existir en el contenedor de cada producto un boton que permita al usuario agregar determinada cantidad de un producto al carrito de compras.

## **Epica 3: Confirmar orden y procesar orden**

### *Feature 1: Módulo de Checkout y pagos*  
#### **US-6:** Como estudiante de CESDE, quiero realizar una validacion de los productos seleccionados, visualizar mi carrito de compras y regresar al portal de compras de ser necesario
#### Criterios de aceptación
  1. La pantalla del carrito de compra debera contener un boton para procesar el pago
  2. Al dar click sobre este boton, debera dirigir al usuario a una pantalla donde podra procesar el pago.
  3. El carrito de compras debera mostrarme un detalle por producto
  4. El carrito de compras permite agregar o quitar productos
  5. El carrito de compras permite eliminar un producto
  6. el carrio de compras permite regresar al comercio/menú
  7. El carrito de compras debera mostrar un detalle del valor a pagar
#### Tareas:
1. El link para regresar al comercio debera permitir que el usuario seleccione mas productos sin perder la selección actual
2. Debera mostrarse el valor por cada unidad y el valor por el numero de unidades elegidas por el cliente.
3. Los valores deberan modificarse en tiempo real
4. El carrito valida que haya mas de un producto antes de iniciar el pago
5. El usuario pobre usar las fechas en el cuadro de texto de la cantidad para agregar o quitar peoductos y ademas podra hacerlo por teclado
 
#### **US-7:** Como estudiante de CESDE, elegir el metodo de pago que mas me convenga luego de validar los productos a comprar.
#### Criterios de aceptación
  1. El usuario podra elegir entre pago contra entrega, pago con tarjeta o transferencia.
  2. Si el usuario elige un pago contraentrega, el sitio debera dirigir al usuario a una pantalla donde podra visualizar los detalles de su orden y un QR para reclamar en sitio.
  3. Si el usuario elige otro metodo de pago diferente a contraentrega, debera desplegar los campos para ingresar sus datos de pago.
  #### Tareas:
  1. Front debera de agregar un boton al carrito de compras que diga "pagar"
  2. Front debera ademas diseñar una pantalla para que luego de procesado el pago, se muestre la confirmación de la orden.
  3. Si el cliente elige una forma de pago contraentrega, no debera mostrar campos para llenar información alguna sino una pantalla de resumen mostrando la información del usuario, los productos adquiridos y un QR para reclamar en caja.
  4. Al seleccionar metodo de pago con tarjeta, se despliegan campos adicionales para ingresar los datos de la tarjeta.
  5. Al pagar, el sistema dirige automaticamente a la orden
  6. al pagar, el sistema guarda el detalle de la compra para mostrarlo en el historial de ordenes

### *Feature 2: Módulo de ordenes* 
### **US-8:** Como estudiante de CESDE, deseo tener una confirmación de mi compra, y obtener un comprobante para reclamar mi pedido en la tienda fisica
#### Criterios de aceptación:
  1. El usuario visualiza el estado de la transacción, una fecha y un numero de orden
  2. El usuario visualiza el detalle de los productos comprados, cantidades, valores y nombres
  3. El usuario obtiene un codigo QR con el que se validara la compra en el sitio fisico
  4. Debera existir un boton para regresar al catalogo de productos
  #### Tareas
  1. El sistema debera generar un numero de orden de forma automatica
  2. El sistema debera registrar la fecha con hora (minutos y segundos) en el que se realizó la transacción
  3. El sistema debera mostrar el detalle por producto y desglosado.
  El sistema genera de forma automatica un codigo QR que tambien se comparte con el sistema del propietario
  4. Al leer el codigo QR muestra una factura o recibo con la misma información mostrada al cliente el momento de la compra
  5. El boton "Regresar al catalogo" regresa correctamente al catalogo de productos sin terminar la sesión o conservar datos en el carrito de compras