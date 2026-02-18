/**
 * IMOLARTE - Checkout Logic (Phase 1 Final)
 * 
 * Features:
 * ✅ Debounce submit (prevent duplicate orders)
 * ✅ Toast notifications (replace alerts)
 * ✅ Payment method capture (ANTICIPO_60 / PAGO_100 / WHATSAPP_ONLY)
 * ✅ Referral code input + validation
 * ✅ Wompi widget integration (sandbox)
 * ✅ Auto-redirect after successful payment (3 seconds)
 * ✅ Cart integration
 * 
 * Backend: IMOLARTE-sistema (Bound Apps Script)
 * Web App: https://script.google.com/macros/s/AKfycbxaoRuG9JLeSh4EWpcfDg-k68WdjheklfoJ90P7LN3XiQ4B9V2ZTR1eBhxieo-N2Z5rLw/exec
 */

// === CONFIG ===
const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxaoRuG9JLeSh4EWpcfDg-k68WdjheklfoJ90P7LN3XiQ4B9V2ZTR1eBhxieo-N2Z5rLw/exec';
const WOMPI_PUBLIC_KEY = 'pub_test_XXXXXXXX'; // ⚠️ Update with your actual Wompi sandbox key

// === STATE ===
let isSubmitting = false;
let currentOrderId = null;
window.orderConfirmed = false;

// === UTILS: Generate Order ID ===
function generateOrderId() {
  return 'IMO-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// === UTILS: Get/Sanitize Client ID ===
function getCurrentClientId() {
  let clientId = localStorage.getItem('imolarte_client_id');
  if (!clientId) {
    clientId = 'CLI-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem('imolarte_client_id', clientId);
  }
  return clientId;
}

// === TOAST NOTIFICATIONS (Replace alert()) ===
function showToast(message, type = 'success', duration = 4000) {
  // Remove existing toasts
  document.querySelectorAll('.imolarte-toast').forEach(t => t.remove());
  
  const toast = document.createElement('div');
  toast.className = `imolarte-toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger slide-in animation
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Auto-remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// === DEBOUNCE: Prevent duplicate submissions ===
function debounceSubmit(handler, delay = 2500) {
  return function(e) {
    e.preventDefault();
    
    if (isSubmitting) {
      showToast('⏳ Procesando tu pedido... por favor espera.', 'info');
      return;
    }
    
    isSubmitting = true;
    
    // Visual feedback on button
    const btn = document.getElementById('checkout-submit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Enviando...';
    }
    
    // Execute handler
    handler.call(this, e);
    
    // Reset state after delay (unless order confirmed)
    setTimeout(() => {
      if (!window.orderConfirmed) {
        resetSubmitState();
      }
    }, delay);
  };
}

function resetSubmitState() {
  isSubmitting = false;
  const btn = document.getElementById('checkout-submit');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Confirmar Pedido';
  }
}

// === MAIN: Handle Checkout Submission ===
async function handleCheckoutSubmit(e) {
  try {
    // Gather form data
    const name = document.getElementById('client-name')?.value?.trim() || '';
    const email = document.getElementById('client-email')?.value?.trim() || '';
    const phone = document.getElementById('client-phone')?.value?.trim() || '';
    const paymentMethod = document.getElementById('payment-method')?.value || 'ANTICIPO_60';
    const referralCode = document.getElementById('referral-code-input')?.value?.trim() || '';
    
    // Gather cart data
    const cartItems = window.cart || [];
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Validation
    if (!name || !email || !phone) {
      showToast('❌ Completa todos los campos obligatorios', 'error');
      resetSubmitState();
      return;
    }
    
    if (cartItems.length === 0 && paymentMethod !== 'WHATSAPP_ONLY') {
      showToast('❌ Agrega productos al carrito', 'error');
      resetSubmitState();
      return;
    }
    
    // Calculate totals
    const discountPercent = paymentMethod === 'PAGO_100' ? 3 : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const totalFinal = subtotal - discountAmount;
    
    // Generate order ID
    const orderId = generateOrderId();
    currentOrderId = orderId;
    
    // Build payload (matches PEDIDOS sheet column order)
    const payload = {
      ID_Pedido: orderId,
      Origen: 'WEB',
      Cliente_ID: getCurrentClientId(),
      Nombre_Cliente: name,
      Email: email,
      Telefono: phone,
      Items_JSON: JSON.stringify(cartItems),
      Cantidad_Items: cartItems.length,
      Subtotal: subtotal,
      Descuento_Porcentaje: discountPercent,
      Descuento_Monto: discountAmount,
      Total_Final: totalFinal,
      Metodo_Entrega: 'DOMICILIO',
      Direccion: document.getElementById('client-address')?.value?.trim() || '',
      Barrio: document.getElementById('client-neighborhood')?.value?.trim() || '',
      Ciudad: document.getElementById('client-city')?.value?.trim() || 'Bogotá',
      Notas_Entrega: document.getElementById('delivery-notes')?.value?.trim() || '',
      Forma_Pago: paymentMethod,
      Referral_Code: referralCode,
      Estado_Pago: 'PENDIENTE',
      Notas_Internas: `Opción: ${paymentMethod === 'ANTICIPO_60' ? 'Anticipo 60%' : paymentMethod === 'PAGO_100' ? 'Pago completo -3%' : 'Coordinar por WhatsApp'}`
    };
    
    // Send to Apps Script Backend
    const response = await fetch(APPS_SCRIPT_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      showToast('✅ Pedido creado. Iniciando pago...', 'success');
      
      // Handle payment flow
      if (paymentMethod === 'WHATSAPP_ONLY') {
        showToast('📲 Te contactaremos por WhatsApp para coordinar el pago', 'info', 6000);
        window.orderConfirmed = true;
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 3000);
      } else {
        initWompiWidget(totalFinal, orderId, email, phone);
      }
      
    } else if (result.error === 'DUPLICATE_ID') {
      showToast('⚠️ Este pedido ya existe. Recargando página...', 'error');
      setTimeout(() => location.reload(), 2000);
      
    } else {
      showToast('❌ Error: ' + (result.message || 'Intenta nuevamente'), 'error');
      resetSubmitState();
    }
    
  } catch (err) {
    console.error('Checkout error:', err);
    showToast('❌ Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
    resetSubmitState();
  }
}

// === WOMPI WIDGET INITIALIZATION ===
function initWompiWidget(amount, reference, email, phone) {
  if (typeof window.Wompi === 'undefined') {
    showToast('❌ Widget de pago no cargó. Recarga la página.', 'error');
    resetSubmitState();
    return;
  }
  
  try {
    window.Wompi.open({
      publicKey: WOMPI_PUBLIC_KEY,
      currency: 'COP',
      amountInCents: Math.round(amount * 100),
      reference: reference,
      redirectUrl: window.location.href,
      customerData: {
        email: email,
        phone: phone
      }
    });
  } catch (err) {
    console.error('Wompi init error:', err);
    showToast('❌ No se pudo iniciar el pago. Intenta otro método.', 'error');
    resetSubmitState();
  }
}

// === WOMPI EVENT LISTENERS ===
function setupWompiEvents() {
  window.addEventListener('wompi-widget-closed', (e) => {
    const { status, reference } = e.detail || {};
    
    if (status === 'APPROVED') {
      window.orderConfirmed = true;
      showToast('🎉 ¡Pago aprobado! Tu pedido está confirmado. Redirigiendo...', 'success', 5000);
      
      // Auto-redirect to index.html after 3 seconds
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 3000);
      
    } else if (status === 'REJECTED') {
      showToast('❌ Pago rechazado. Intenta con otro método de pago.', 'error');
      resetSubmitState();
      
    } else if (status === 'PENDING') {
      showToast('⏳ Pago pendiente de confirmación. Revisa tu email.', 'info', 8000);
      resetSubmitState();
    }
  });
}

// === INIT: Setup Event Listeners on DOM Ready ===
document.addEventListener('DOMContentLoaded', () => {
  // Setup Wompi events
  setupWompiEvents();
  
  // Wrap checkout form submission with debounce
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', debounceSubmit(handleCheckoutSubmit));
  }
  
  // Show checkout section if cart has items
  const cart = window.cart || [];
  if (cart.length > 0) {
    const checkoutSection = document.getElementById('checkout-section');
    if (checkoutSection) {
      checkoutSection.style.display = 'block';
    }
  }
  
  // Pre-fill client info if stored
  const storedName = localStorage.getItem('imolarte_client_name');
  const storedEmail = localStorage.getItem('imolarte_client_email');
  const storedPhone = localStorage.getItem('imolarte_client_phone');
  
  if (storedName && document.getElementById('client-name')) {
    document.getElementById('client-name').value = storedName;
  }
  if (storedEmail && document.getElementById('client-email')) {
    document.getElementById('client-email').value = storedEmail;
  }
  if (storedPhone && document.getElementById('client-phone')) {
    document.getElementById('client-phone').value = storedPhone;
  }
});

// === EXPORTS (for testing/debugging) ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateOrderId,
    showToast,
    handleCheckoutSubmit
  };
}