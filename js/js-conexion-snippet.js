/*
  Snippet de conexión para el estudiante.
  Se carga al final de pago.html y orden.html para conectar el flujo de compra.
*/

// 1. Inyectar el usuario guardado después del login.
const customerStorage = localStorage.getItem('customerLogged');
const customer = customerStorage ? JSON.parse(customerStorage) : null;
const loggedUserName = document.querySelector('#loggedUserName');

if (customer && loggedUserName) {
  // El nombre puede venir como customer.name o customer.userName, según tu clase Customer.
  loggedUserName.textContent = customer.name || customer.userName;
}

const customerName = customer?.name || customer?.userName || 'Cliente';
const customerId = customer?.Id || customer?.id || '';
const paymentCustomerName = document.querySelector('#paymentCustomerName');
const paymentCustomerId = document.querySelector('#paymentCustomerId');
const orderCustomer = document.querySelector('#orderCustomer');
const orderCustomerId = document.querySelector('#orderCustomerId');

if (paymentCustomerName) {
  paymentCustomerName.textContent = customerName;
}

if (paymentCustomerId) {
  paymentCustomerId.textContent = customerId ? ` · ID ${customerId}` : '';
}

if (orderCustomer) {
  orderCustomer.textContent = customerName;
}

if (orderCustomerId) {
  orderCustomerId.textContent = customerId ? `ID ${customerId}` : '';
}

// 2. Mostrar u ocultar los campos de tarjeta según el método elegido.
const paymentOptions = document.querySelectorAll('input[name="method"]');
const cardFields = document.querySelector('#cardFields');

const toggleCardFields = (method) => {
  const isCardPayment = method === 'tarjeta';

  if (!cardFields) {
    return;
  }

  cardFields.hidden = !isCardPayment;
  cardFields.querySelectorAll('input').forEach((input) => {
    input.required = isCardPayment;
  });
};

const selectedPayment = document.querySelector('input[name="method"]:checked');
toggleCardFields(selectedPayment?.value);

paymentOptions.forEach((option) => {
  option.addEventListener('change', (event) => {
    toggleCardFields(event.target.value);
  });
});

// 3. Validar el método elegido y avanzar a la orden.
const paymentForm = document.querySelector('#paymentForm');
const paymentMessage = document.querySelector('#paymentMessage');

if (paymentForm) {
  paymentForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const selectedMethod = document.querySelector('input[name="method"]:checked')?.value;
    const isCardPayment = selectedMethod === 'tarjeta';

    if (isCardPayment && !paymentForm.checkValidity()) {
      paymentMessage.textContent = 'Completa todos los datos de la tarjeta para continuar.';
      paymentMessage.classList.add('form-message--error');
      paymentForm.reportValidity();
      return;
    }

    const orderData = {
      orderId: `ORD-${Date.now()}`,
      date: new Date().toLocaleString('es-CO'),
      customerName,
      customerId,
      paymentMethod: selectedMethod
    };

    localStorage.setItem('orderData', JSON.stringify(orderData));
    window.location.href = 'orden.html';
  });
}

// 4. Mostrar en orden.html los datos guardados al confirmar el pago.
const savedOrderStorage = localStorage.getItem('orderData');
const savedOrder = savedOrderStorage ? JSON.parse(savedOrderStorage) : null;

if (savedOrder) {
  const orderId = document.querySelector('#orderId');
  const orderDate = document.querySelector('#orderDate');
  const orderPaymentMethod = document.querySelector('#orderPaymentMethod');

  if (orderId) orderId.textContent = savedOrder.orderId;
  if (orderDate) orderDate.textContent = savedOrder.date;
  if (orderPaymentMethod) orderPaymentMethod.textContent = savedOrder.paymentMethod;
}
