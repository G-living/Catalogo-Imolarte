/**
 * ================================================================
 * IMOLARTE - CHECKOUT.JS
 * ================================================================
 * Sistema de checkout con flujos separados
 * Versión: 5.0 ESTABLE
 * ================================================================
 */

// ===== VARIABLES GLOBALES =====

let currentPaymentMethod = null;

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  initCheckout();
  populateBirthdaySelects();
  console.log('✅ Checkout inicializado v5.0');
});

/**
 * Inicializa el checkout
 */
function initCheckout() {
  // Botón abrir checkout
  const checkoutBtn = document.getElementById('proceedCheckout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckout);
  }
  
  // Botón cerrar checkout
  const closeBtn = document.getElementById('closeCheckout');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCheckout);
  }
  
  // Delivery method
  const deliveryInputs = document.querySelectorAll('input[name="delivery"]');
  deliveryInputs.forEach(input => {
    input.addEventListener('change', handleDeliveryChange);
  });
  
  // Payment method
  const paymentInputs = document.querySelectorAll('input[name="paymentMethod"]');
  paymentInputs.forEach(input => {
    input.addEventListener('change', handlePaymentChange);
  });
  
  // Form submit
  const form = document.getElementById('checkoutForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
}

// ===== ABRIR/CERRAR CHECKOUT =====

/**
 * Abre el modal de checkout
 */
function openCheckout() {
  if (window.cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }
  
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateOrderSummary();
  }
}

/**
 * Cierra el modal de checkout
 */
function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ===== MANEJO DE OPCIONES =====

/**
 * Maneja cambio de método de entrega
 */
function handleDeliveryChange(e) {
  const isHome = e.target.value === 'home';
  const addressFields = document.getElementById('addressFields');
  
  if (addressFields) {
    addressFields.style.display = isHome ? 'block' : 'none';
    
    // Requerir campos de dirección solo si es domicilio
    const addressInputs = addressFields.querySelectorAll('input[required], select[required]');
    addressInputs.forEach(input => {
      if (isHome) {
        input.setAttribute('required', 'required');
      } else {
        input.removeAttribute('required');
      }
    });
  }
}

/**
 * Maneja cambio de método de pago
 */
function handlePaymentChange(e) {
  currentPaymentMethod = e.target.value;
  
  const wompiSection = document.getElementById('wompiPaymentOptions');
  const whatsappSection = document.getElementById('whatsappOption');
  
  if (currentPaymentMethod === 'wompi') {
    // Mostrar opciones Wompi, ocultar WhatsApp
    if (wompiSection) wompiSection.style.display = 'block';
    if (whatsappSection) whatsappSection.style.display = 'none';
    updateOrderSummary(true); // Con descuento
  } else {
    // Mostrar WhatsApp, ocultar Wompi
    if (wompiSection) wompiSection.style.display = 'none';
    if (whatsappSection) whatsappSection.style.display = 'block';
    updateOrderSummary(false); // Sin descuento
  }
}

// ===== RESUMEN DEL PEDIDO =====

/**
 * Actualiza el resumen del pedido
 */
function updateOrderSummary(showDiscount = false) {
  const summaryContainer = document.getElementById('checkoutSummary');
  if (!summaryContainer) return;
  
  const subtotal = window.getCartTotal();
  const discount = showDiscount ? Math.round(subtotal * 0.03) : 0;
  const total = subtotal - discount;
  const anticipo = Math.round(total * 0.60);
  
  let html = '<div class="order-summary">';
  html += '<h3>Resumen del Pedido</h3>';
  
  // Items
  window.cart.forEach(item => {
    html += `
      <div class="summary-item">
        <span>${item.quantity}× ${item.description} (${item.collection})</span>
        <span>${window.formatPrice(item.price * item.quantity)}</span>
      </div>
    `;
  });
  
  // Totales
  html += '<div class="summary-totals">';
  html += `<div class="summary-line"><span>Subtotal:</span><span>${window.formatPrice(subtotal)}</span></div>`;
  
  if (showDiscount && discount > 0) {
    html += `<div class="summary-line discount"><span>Descuento (3%):</span><span>-${window.formatPrice(discount)}</span></div>`;
  }
  
  html += `<div class="summary-line total"><span>Total:</span><span>${window.formatPrice(total)}</span></div>`;
  html += '</div>';
  
  // Montos de pago (solo si es Wompi)
  if (currentPaymentMethod === 'wompi') {
    html += `
      <div class="payment-amounts">
        <div class="payment-amount-item">
          <span>Anticipo 60%:</span>
          <strong>${window.formatPrice(anticipo)}</strong>
        </div>
        <div class="payment-amount-item">
          <span>Pago completo:</span>
          <strong>${window.formatPrice(total)}</strong>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  
  summaryContainer.innerHTML = html;
}

// ===== ENVÍO DEL FORMULARIO =====

/**
 * Maneja el envío del formulario
 */
function handleSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Recopilar datos
  const pedido = recopilarDatos();
  
  if (currentPaymentMethod === 'wompi') {
    // TODO: Integrar Wompi
    alert('Integración Wompi: En desarrollo');
    console.log('Pedido para Wompi:', pedido);
  } else {
    // Enviar por WhatsApp
    enviarPorWhatsApp(pedido);
  }
}

/**
 * Recopila datos del formulario
 */
function recopilarDatos() {
  const form = document.getElementById('checkoutForm');
  
  // Cliente
  const cliente = {
    tipoDocumento: document.getElementById('docType').value,
    numeroDocumento: document.getElementById('docNumber').value,
    nombre: document.getElementById('firstName').value,
    apellido: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    codigoPais: document.getElementById('countryCode').value,
    telefono: document.getElementById('phone').value,
    cumpleDia: document.getElementById('birthdayDay').value,
    cumpleMes: document.getElementById('birthdayMonth').value
  };
  
  // Entrega
  const metodoEntrega = document.querySelector('input[name="delivery"]:checked').value;
  const esDomicilio = metodoEntrega === 'home';
  
  const entrega = {
    metodo: metodoEntrega,
    direccion: esDomicilio ? document.getElementById('address').value : '',
    barrio: esDomicilio ? document.getElementById('neighborhood').value : '',
    ciudad: esDomicilio ? document.getElementById('city').value : '',
    notas: esDomicilio ? document.getElementById('deliveryNotes').value : ''
  };
  
  // Totales
  const subtotal = window.getCartTotal();
  const descuento = currentPaymentMethod === 'wompi' ? Math.round(subtotal * 0.03) : 0;
  const total = subtotal - descuento;
  
  return {
    cliente,
    entrega,
    items: window.cart,
    subtotal,
    descuento,
    total,
    tipoPago: currentPaymentMethod,
    fecha: new Date().toISOString()
  };
}

/**
 * Envía pedido por WhatsApp
 */
function enviarPorWhatsApp(pedido) {
  const { cliente, entrega, items, subtotal, descuento, total } = pedido;
  
  let mensaje = '🛒 *NUEVO PEDIDO - IMOLARTE*\n\n';
  mensaje += `📅 ${new Date().toLocaleDateString('es-CO')}\n\n`;
  
  mensaje += '👤 *CLIENTE*\n';
  mensaje += `${cliente.tipoDocumento}: ${cliente.numeroDocumento}\n`;
  mensaje += `${cliente.nombre} ${cliente.apellido}\n`;
  mensaje += `📧 ${cliente.email}\n`;
  mensaje += `📱 ${cliente.codigoPais}${cliente.telefono}\n`;
  mensaje += `🎂 ${cliente.cumpleDia} de ${cliente.cumpleMes}\n\n`;
  
  mensaje += '📦 *PRODUCTOS*\n';
  mensaje += '━━━━━━━━━━━━━━━━━━\n';
  items.forEach((item, i) => {
    mensaje += `${i + 1}. ${item.description}\n`;
    mensaje += `   ${item.collection} - ${item.code}\n`;
    mensaje += `   ${item.quantity} × ${window.formatPrice(item.price)}\n`;
    mensaje += `   💰 ${window.formatPrice(item.price * item.quantity)}\n\n`;
  });
  
  mensaje += '━━━━━━━━━━━━━━━━━━\n';
  mensaje += `💵 Subtotal: ${window.formatPrice(subtotal)}\n`;
  if (descuento > 0) {
    mensaje += `🎉 Descuento: -${window.formatPrice(descuento)}\n`;
  }
  mensaje += `💰 *TOTAL: ${window.formatPrice(total)}*\n\n`;
  
  mensaje += '🚚 *ENTREGA*\n';
  if (entrega.metodo === 'home') {
    mensaje += `🏠 ${entrega.direccion}\n`;
    mensaje += `   ${entrega.barrio}, ${entrega.ciudad}\n`;
    if (entrega.notas) {
      mensaje += `📝 ${entrega.notas}\n`;
    }
  } else {
    mensaje += '🏪 Retiro en almacén\n';
  }
  
  const url = `https://wa.me/573004257367?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
  
  // Limpiar carrito y cerrar
  setTimeout(() => {
    window.clearCart();
    closeCheckout();
  }, 1000);
}

// ===== UTILIDADES =====

/**
 * Llena los selects de cumpleaños
 */
function populateBirthdaySelects() {
  const daySelect = document.getElementById('birthdayDay');
  const monthSelect = document.getElementById('birthdayMonth');
  
  if (daySelect) {
    for (let i = 1; i <= 31; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      daySelect.appendChild(option);
    }
  }
  
  if (monthSelect) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = month;
      monthSelect.appendChild(option);
    });
  }
}

// ===== EXPORTAR =====

window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
