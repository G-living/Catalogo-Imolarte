// checkout-whatsapp.js
// IMOLARTE - WhatsApp Wishlist Integration
// Version: 2.1 - Fixed duplicate SHEETS_CONFIG

// ===== CONFIGURATION =====
const WHATSAPP_CONFIG = {
  number: '573004257367',
  businessName: 'IMOLARTE'
};

const WHATSAPP_SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec'
};

// ===== MAIN WHATSAPP FLOW =====
async function handleWhatsAppWishlist() {
  console.log('📱 Iniciando envío por WhatsApp (wishlist)...');
  
  // 1. Validate form
  if (typeof window.validateCheckoutForm !== 'function') {
    console.error('checkout-validation.js no está cargado');
    showToast('Error: Sistema de validación no disponible', 'error');
    return;
  }
  
  const isValid = window.validateCheckoutForm();
  if (!isValid) {
    console.log('⛔ Validación falló');
    return;
  }
  
  console.log('✅ Validación pasó');
  
  // 2. Show loading
  showLoadingOverlay('Registrando wishlist...');
  
  try {
    // 3. Register in Google Sheets (NO Dono applied - wishlist only)
    const orderData = await registerWishlistInSheets();
    
    if (!orderData || !orderData.pedidoId) {
      throw new Error('No se pudo registrar la wishlist en Google Sheets');
    }
    
    console.log(`✅ Wishlist registrada: ${orderData.pedidoId}`);
    console.log(`✅ Cliente ID: ${orderData.clienteId}`);
    
    // 4. Format WhatsApp message
    const message = formatWhatsAppMessage(orderData);
    
    // 5. Open WhatsApp
    hideLoadingOverlay();
    openWhatsApp(message);
    
    // 6. Show confirmation
    showToast('✅ Wishlist enviada por WhatsApp', 'success');
    
    // 7. Clear cart after sending
    setTimeout(() => {
      if (window.cart) {
        window.cart = [];
        if (typeof window.updateCartUI === 'function') {
          window.updateCartUI();
        }
      }
      closeCheckoutModal();
      if (typeof window.hideCartPage === 'function') {
        window.hideCartPage();
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error en WhatsApp flow:', error);
    hideLoadingOverlay();
    
    if (error.message.includes('Google Sheets')) {
      showServiceUnavailableError();
    } else {
      showToast('Error al procesar la wishlist. Por favor intenta nuevamente.', 'error');
    }
  }
}

// ===== GOOGLE SHEETS REGISTRATION =====
async function registerWishlistInSheets() {
  try {
    console.log('📊 Registrando wishlist en Google Sheets...');
    
    const subtotal = getCartTotal();
    
    // IMPORTANTE: Dono NO se aplica en WhatsApp flow
    // Es solo una wishlist para seguimiento personal
    
    // Collect form data
    const formData = {
      // Cliente
      tipoDocumento: document.getElementById('docType').value,
      numeroDocumento: document.getElementById('docNumber').value,
      nombre: document.getElementById('firstName').value,
      apellido: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      codigoPais: document.getElementById('countryCode').value,
      telefono: document.getElementById('phone').value,
      cumpleDia: document.getElementById('birthdayDay').value,
      cumpleMes: document.getElementById('birthdayMonth').value,
      
      // Entrega
      metodoEntrega: document.querySelector('input[name="delivery"]:checked').value,
      direccion: document.getElementById('address')?.value || '',
      barrio: document.getElementById('neighborhood')?.value || '',
      ciudad: document.getElementById('city')?.value || '',
      notasDireccion: document.getElementById('notes')?.value || '',
      
      // Items
      items: JSON.stringify(window.cart || []),
      
      // Totales
      subtotal: subtotal,
      descuentoPorcentaje: 0,
      descuentoMonto: 0,
      totalFinal: subtotal,
      
      // Pago - WhatsApp flow, sin Dono
      tipoPago: 'WHATSAPP_ONLY',
      notasInternas: 'Pedido vía WhatsApp - Pago pendiente - Requiere seguimiento personal',
      
      // Sin Dono
      donoCode: '',
      donoAmount: 0,
      paymentType: 'WHATSAPP'
    };
    
    // Send to Sheets
    const params = new URLSearchParams(formData);
    
    const response = await fetch(WHATSAPP_SHEETS_CONFIG.webAppUrl, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      body: params
    });
    
    if (!response.ok) {
      throw new Error('Google Sheets: Error en respuesta HTTP');
    }
    
    const text = await response.text();
    const result = JSON.parse(text);
    
    if (result.success && result.pedidoId) {
      console.log(`✅ Sheets: Wishlist ${result.pedidoId} registrada`);
      return {
        pedidoId: result.pedidoId,
        clienteId: result.clienteId || 'N/A',
        subtotal: subtotal
      };
    } else {
      throw new Error('Google Sheets: No se recibió pedidoId');
    }
    
  } catch (error) {
    console.error('❌ Error en Sheets:', error);
    throw new Error('Google Sheets: ' + error.message);
  }
}

// ===== WHATSAPP MESSAGE FORMATTING =====
function formatWhatsAppMessage(orderData) {
  const formData = collectFormData();
  const items = window.cart || [];
  
  let message = `🛒 *WISHLIST - ${WHATSAPP_CONFIG.businessName}*\n\n`;
  
  // IDs from Sheets
  message += `🆔 *ID Wishlist:* ${orderData.pedidoId}\n`;
  message += `👤 *ID Cliente:* ${orderData.clienteId}\n`;
  message += `📅 *Fecha:* ${new Date().toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}\n\n`;
  
  // Cliente
  message += `👤 *CLIENTE*\n`;
  message += `📝 ${formData.tipoDocumento}: ${formData.numeroDocumento}\n`;
  message += `Nombre: ${formData.nombre} ${formData.apellido}\n`;
  message += `📧 ${formData.email}\n`;
  message += `📱 ${formData.codigoPais}${formData.telefono}\n`;
  message += `🎂 ${formData.cumpleDia} de ${formData.cumpleMes}\n\n`;
  
  // Productos
  message += `📦 *PRODUCTOS*\n`;
  message += `━━━━━━━━━━━━━━━━━━━\n`;
  
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.productName || item.description}\n`;
    message += `   ${item.collection} - ${item.code}\n`;
    message += `   ${item.quantity} × ${formatPrice(item.price)}\n`;
    message += `   💰 ${formatPrice(item.price * item.quantity)}\n\n`;
  });
  
  message += `━━━━━━━━━━━━━━━━━━━\n`;
  message += `💵 *TOTAL: ${formatPrice(orderData.subtotal)}*\n\n`;
  
  // Método de Entrega
  message += `🚚 *ENTREGA*\n`;
  if (formData.metodoEntrega === 'home') {
    message += `🏠 Entrega a Domicilio\n`;
    message += `📍 ${formData.direccion}\n`;
    message += `   ${formData.barrio}, ${formData.ciudad}\n`;
    if (formData.notasDireccion) {
      message += `📝 ${formData.notasDireccion}\n`;
    }
  } else {
    message += `🏪 Retiro en Almacén\n`;
  }
  
  message += `\n💬 *Pendiente: Revisar formas de pago*`;
  message += `\n📞 *Requiere seguimiento personal*`;
  
  return message;
}

// ===== WHATSAPP INTEGRATION =====
function openWhatsApp(message) {
  console.log('📱 Abriendo WhatsApp...');
  
  const url = `https://wa.me/${WHATSAPP_CONFIG.number}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  
  console.log('✅ WhatsApp abierto');
}

// ===== UTILITY FUNCTIONS =====
function collectFormData() {
  return {
    tipoDocumento: document.getElementById('docType').value,
    numeroDocumento: document.getElementById('docNumber').value,
    nombre: document.getElementById('firstName').value,
    apellido: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    codigoPais: document.getElementById('countryCode').value,
    telefono: document.getElementById('phone').value,
    cumpleDia: document.getElementById('birthdayDay').value,
    cumpleMes: document.getElementById('birthdayMonth').value,
    metodoEntrega: document.querySelector('input[name="delivery"]:checked').value,
    direccion: document.getElementById('address')?.value || '',
    barrio: document.getElementById('neighborhood')?.value || '',
    ciudad: document.getElementById('city')?.value || '',
    notasDireccion: document.getElementById('notes')?.value || ''
  };
}

function getCartTotal() {
  if (!window.cart || !Array.isArray(window.cart)) {
    return 0;
  }
  return window.cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

function formatPrice(price) {
  return '$' + Math.round(price).toLocaleString('es-CO');
}

// ===== UI HELPERS =====
function showLoadingOverlay(message) {
  let overlay = document.getElementById('whatsapp-loading-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'whatsapp-loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #whatsapp-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
      }
      #whatsapp-loading-overlay .loading-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        min-width: 300px;
      }
      #whatsapp-loading-overlay .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #25D366;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      #whatsapp-loading-overlay .loading-message {
        font-family: 'Lato', sans-serif;
        color: #2c3e50;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('whatsapp-loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showServiceUnavailableError() {
  const overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: 'Lato', sans-serif;
    ">
      <div style="
        background: white;
        padding: 3rem;
        border-radius: 12px;
        text-align: center;
        max-width: 500px;
      ">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="color: #e74c3c; margin-bottom: 1rem;">Actualmente Fuera de Servicio</h2>
        <p style="color: #7f8c8d; margin-bottom: 2rem;">
          Nuestro sistema está experimentando dificultades técnicas. 
          Por favor intenta nuevamente en unos minutos.
        </p>
        <button onclick="location.reload()" style="
          background: #c9a961;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
        ">Reintentar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  document.body.style.pointerEvents = 'none';
  overlay.style.pointerEvents = 'all';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 checkout-whatsapp.js cargado - Solo wishlist, sin Dono');
  
  const btnWhatsApp = document.getElementById('btnWhatsApp');
  
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', handleWhatsAppWishlist);
    console.log('✅ Botón WhatsApp conectado (wishlist)');
  } else {
    console.warn('⚠️ btnWhatsApp no encontrado');
  }
});

window.handleWhatsAppWishlist = handleWhatsAppWishlist;

console.log('📦 checkout-whatsapp.js loaded v2.1 - Wishlist only');