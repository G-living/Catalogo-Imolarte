/**
 * checkout-payment.js - IMOLARTE Wompi Payment Integration
 * Handles 60% deposit and 100% full payment flows with Dono support
 * Version: 2.0 - Added auto-redirect and Dono integration
 */

// ===== CONFIGURATION =====
const WOMPI_CONFIG = {
  publicKey: 'pub_test_rT7K8rzYnk2Ec8Lv25tRL3JIof6b6Lwp',
  signatureGeneratorUrl: 'https://imolarte-signature-generator.filippo-massara2016.workers.dev',
  currency: 'COP'
};

const SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec'
};

const PAYMENT_CONFIG = {
  depositPercentage: 0.60,
  discountPercentage: 0.03
};

// ===== PAYMENT FLOW: ANTICIPO 60% =====
async function handlePagarAnticipo() {
  console.log('💳 Iniciando pago anticipo 60%...');
  
  // Check if Dono covers full amount
  if (window.donoToApply && window.donoToApply.amount >= getCartTotal()) {
    return processDonoOnlyPayment('ANTICIPO_60');
  }
  
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
  
  // 2. Calculate amount
  const subtotal = getCartTotal();
  const depositAmount = Math.round(subtotal * PAYMENT_CONFIG.depositPercentage);
  const amountInCents = depositAmount * 100;
  
  console.log(`💰 Subtotal: ${formatPrice(subtotal)}`);
  console.log(`💰 Anticipo 60%: ${formatPrice(depositAmount)}`);
  
  // 3. Show loading
  showLoadingOverlay('Registrando pedido...');
  
  try {
    // 4. Register in Google Sheets (with Dono if applied)
    const pedidoId = await registerOrderInSheets('ANTICIPO_60', subtotal, 0, 0, subtotal);
    
    if (!pedidoId) {
      throw new Error('No se pudo registrar el pedido en Google Sheets');
    }
    
    console.log(`✅ Pedido registrado: ${pedidoId}`);
    
    // 5. Get signature from Cloudflare Worker
    updateLoadingMessage('Generando firma de seguridad...');
    const signature = await getPaymentSignature(pedidoId, amountInCents);
    
    if (!signature) {
      throw new Error('No se pudo generar la firma de pago');
    }
    
    console.log('✅ Firma generada');
    
    // 6. Prepare customer data
    const customerData = collectCustomerData();
    
    // 7. Open Wompi widget
    updateLoadingMessage('Abriendo pasarela de pago...');
    
    await openWompiWidget({
      reference: pedidoId,
      amountInCents: amountInCents,
      signature: signature,
      customerData: customerData
    });
    
  } catch (error) {
    console.error('❌ Error en pago anticipo:', error);
    hideLoadingOverlay();
    
    if (error.message.includes('Google Sheets')) {
      showServiceUnavailableError();
    } else {
      showToast('Error al procesar el pago. Por favor intenta nuevamente.', 'error');
    }
  }
}

// ===== PAYMENT FLOW: PAGO COMPLETO 100% =====
async function handlePagarCompleto() {
  console.log('💎 Iniciando pago completo 100%...');
  
  // Check if Dono covers full amount
  if (window.donoToApply && window.donoToApply.amount >= getCartTotal()) {
    return processDonoOnlyPayment('PAGO_100');
  }
  
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
  
  // 2. Calculate amount with discount
  const subtotal = getCartTotal();
  const discountAmount = Math.round(subtotal * PAYMENT_CONFIG.discountPercentage);
  const finalAmount = subtotal - discountAmount;
  const amountInCents = finalAmount * 100;
  
  console.log(`💰 Subtotal: ${formatPrice(subtotal)}`);
  console.log(`🎉 Descuento 3%: ${formatPrice(discountAmount)}`);
  console.log(`💰 Total final: ${formatPrice(finalAmount)}`);
  
  // 3. Show loading
  showLoadingOverlay('Registrando pedido...');
  
  try {
    // 4. Register in Google Sheets (with Dono if applied)
    const pedidoId = await registerOrderInSheets(
      'PAGO_100', 
      subtotal, 
      PAYMENT_CONFIG.discountPercentage * 100, 
      discountAmount, 
      finalAmount
    );
    
    if (!pedidoId) {
      throw new Error('No se pudo registrar el pedido en Google Sheets');
    }
    
    console.log(`✅ Pedido registrado: ${pedidoId}`);
    
    // 5. Get signature
    updateLoadingMessage('Generando firma de seguridad...');
    const signature = await getPaymentSignature(pedidoId, amountInCents);
    
    if (!signature) {
      throw new Error('No se pudo generar la firma de pago');
    }
    
    console.log('✅ Firma generada');
    
    // 6. Prepare customer data
    const customerData = collectCustomerData();
    
    // 7. Open Wompi widget
    updateLoadingMessage('Abriendo pasarela de pago...');
    
    await openWompiWidget({
      reference: pedidoId,
      amountInCents: amountInCents,
      signature: signature,
      customerData: customerData
    });
    
  } catch (error) {
    console.error('❌ Error en pago completo:', error);
    hideLoadingOverlay();
    
    if (error.message.includes('Google Sheets')) {
      showServiceUnavailableError();
    } else {
      showToast('Error al procesar el pago. Por favor intenta nuevamente.', 'error');
    }
  }
}

// ===== DONO-ONLY PAYMENT (no Wompi) =====
async function processDonoOnlyPayment(tipoPago) {
  console.log('🎉 Procesando pago solo con Dono...');
  
  // 1. Validate form
  if (typeof window.validateCheckoutForm !== 'function') {
    console.error('checkout-validation.js no está cargado');
    showToast('Error: Sistema de validación no disponible', 'error');
    return;
  }
  
  const isValid = window.validateCheckoutForm();
  if (!isValid) return;
  
  // 2. Show loading
  showLoadingOverlay('Procesando pago con Dono...');
  
  try {
    const subtotal = getCartTotal();
    const donoAmount = window.donoToApply.amount;
    
    // 3. Register in Sheets with Dono info
    const pedidoId = await registerOrderInSheets(
      tipoPago,
      subtotal,
      0,
      0,
      0, // Total 0 because Dono covers it
      window.donoToApply.code,
      donoAmount,
      'DONO_FULL'
    );
    
    if (!pedidoId) {
      throw new Error('No se pudo registrar el pedido');
    }
    
    console.log(`✅ Pedido registrado con Dono: ${pedidoId}`);
    
    // 4. Show success
    hideLoadingOverlay();
    showToast('✅ ¡Pago exitoso con Dono! Redirigiendo...', 'success');
    
    // 5. Clear cart
    if (window.cart) {
      window.cart = [];
      if (typeof window.updateCartUI === 'function') {
        window.updateCartUI();
      }
    }
    
    // 6. Close modals
    closeCheckoutModal();
    if (typeof window.hideCartPage === 'function') {
      window.hideCartPage();
    }
    
    // 7. AUTO-REDIRECT after 3 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3000);
    
  } catch (error) {
    console.error('Error en pago Dono:', error);
    hideLoadingOverlay();
    showToast('Error al procesar el pago', 'error');
  }
}

// ===== GOOGLE SHEETS INTEGRATION =====
async function registerOrderInSheets(tipoPago, subtotal, descuentoPorcentaje, descuentoMonto, totalFinal, donoCode = null, donoAmount = null, paymentType = 'WOMPI') {
  try {
    console.log('📊 Registrando en Google Sheets...');
    
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
      descuentoPorcentaje: descuentoPorcentaje,
      descuentoMonto: descuentoMonto,
      totalFinal: totalFinal,
      
      // Pago
      tipoPago: tipoPago,
      notasInternas: tipoPago === 'PAGO_100' ? 'Pago completo -3%' : 'Anticipo 60%',
      
      // Dono (if applied)
      donoCode: donoCode || '',
      donoAmount: donoAmount || 0,
      paymentType: paymentType
    };
    
    // Send to Sheets
    const params = new URLSearchParams(formData);
    
    const response = await fetch(SHEETS_CONFIG.webAppUrl, {
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
      console.log(`✅ Sheets: Pedido ${result.pedidoId} registrado`);
      return result.pedidoId;
    } else {
      throw new Error('Google Sheets: No se recibió pedidoId');
    }
    
  } catch (error) {
    console.error('❌ Error en Sheets:', error);
    throw new Error('Google Sheets: ' + error.message);
  }
}

// ===== SIGNATURE GENERATION =====
async function getPaymentSignature(reference, amountInCents) {
  try {
    console.log('🔐 Solicitando firma...');
    
    const response = await fetch(WOMPI_CONFIG.signatureGeneratorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reference: reference,
        amountInCents: amountInCents,
        currency: WOMPI_CONFIG.currency
      })
    });
    
    if (!response.ok) {
      throw new Error('Error al generar firma');
    }
    
    const data = await response.json();
    
    if (data.integritySignature) {
      console.log('✅ Firma recibida');
      return data.integritySignature;
    } else {
      throw new Error('Firma no recibida');
    }
    
  } catch (error) {
    console.error('❌ Error generando firma:', error);
    return null;
  }
}

// ===== WOMPI WIDGET =====
async function openWompiWidget(config) {
  console.log('🎨 Abriendo widget de Wompi...');
  
  // Close checkout modal first
  const checkoutModal = document.getElementById('checkoutModal');
  if (checkoutModal) {
    checkoutModal.classList.remove('active');
  }
  
  // Hide loading
  hideLoadingOverlay();
  
  // Prepare Wompi configuration
  const wompiConfig = {
    currency: WOMPI_CONFIG.currency,
    amountInCents: config.amountInCents,
    reference: config.reference,
    publicKey: WOMPI_CONFIG.publicKey,
    redirectUrl: window.location.origin + '/',
    signature: {
      integrity: config.signature
    },
    customerData: config.customerData
  };
  
  console.log('📤 Configuración Wompi:', {
    reference: wompiConfig.reference,
    amount: wompiConfig.amountInCents / 100,
    email: wompiConfig.customerData.email
  });
  
  // Open Wompi widget
  try {
    const checkout = new WidgetCheckout(wompiConfig);
    checkout.open(function(result) {
      console.log('🎯 Wompi result:', result);
      
      if (result.transaction) {
        const transaction = result.transaction;
        console.log('✅ Transacción completada:', transaction.id);
        
        if (transaction.status === 'APPROVED') {
          // Show success toast
          showToast('✅ ¡Pago exitoso! Redirigiendo al catálogo...', 'success');
          
          // Clear cart
          if (window.cart) {
            window.cart = [];
            if (typeof window.updateCartUI === 'function') {
              window.updateCartUI();
            }
          }
          
          // AUTO-REDIRECT after 3 seconds
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 3000);
          
        } else if (transaction.status === 'DECLINED') {
          showToast('❌ El pago fue rechazado. Intenta con otro método.', 'error');
        } else {
          showToast('ℹ️ Estado: ' + transaction.status, 'info');
        }
      }
    });
  } catch (error) {
    console.error('❌ Error abriendo widget:', error);
    showToast('Error al abrir la pasarela de pago', 'error');
  }
}

// ===== UTILITY FUNCTIONS =====
function collectCustomerData() {
  const countryCode = document.getElementById('countryCode').value;
  const phone = document.getElementById('phone').value;
  
  return {
    email: document.getElementById('email').value,
    fullName: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
    phoneNumber: countryCode + phone,
    phoneNumberPrefix: countryCode,
    legalId: document.getElementById('docNumber').value,
    legalIdType: document.getElementById('docType').value
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
  let overlay = document.getElementById('payment-loading-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'payment-loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner"></div>
        <p class="loading-message" id="loadingMessage">${message}</p>
      </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      #payment-loading-overlay {
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
      .loading-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        min-width: 300px;
      }
      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #c9a961;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .loading-message {
        font-family: 'Lato', sans-serif;
        color: #2c3e50;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(overlay);
  } else {
    document.getElementById('loadingMessage').textContent = message;
    overlay.style.display = 'flex';
  }
}

function updateLoadingMessage(message) {
  const msgElement = document.getElementById('loadingMessage');
  if (msgElement) {
    msgElement.textContent = message;
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('payment-loading-overlay');
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
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('💳 checkout-payment.js cargado');
  
  // Attach to payment buttons
  const btnAnticipo = document.getElementById('btnAnticipo');
  const btnPagoCompleto = document.getElementById('btnPagoCompleto');
  
  if (btnAnticipo) {
    btnAnticipo.addEventListener('click', handlePagarAnticipo);
    console.log('✅ Botón Anticipo conectado');
  }
  
  if (btnPagoCompleto) {
    btnPagoCompleto.addEventListener('click', handlePagarCompleto);
    console.log('✅ Botón Pago Completo conectado');
  }
});

// Export
window.handlePagarAnticipo = handlePagarAnticipo;
window.handlePagarCompleto = handlePagarCompleto;

console.log('📦 checkout-payment.js loaded v2.0');