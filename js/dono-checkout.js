/**
 * dono-checkout.js - Validación y aplicación de códigos Dono en checkout
 * Versión: 1.5 - CORREGIDO DEFINITIVAMENTE
 */

// ===== CONFIGURATION =====
const DONO_CHECKOUT_SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec'
};

// ===== STATE =====
let validatedDono = null;

// ===== INITIALIZE =====
function initDonoCheckout() {
  console.log('🎁 Inicializando validación Dono en checkout...');
  
  const validateBtn = document.getElementById('validateDonoBtn');
  const donoInput = document.getElementById('donoCode');
  
  if (!validateBtn || !donoInput) {
    console.warn('Elementos Dono no encontrados en checkout');
    return;
  }
  
  validateBtn.addEventListener('click', validateDonoCode);
  
  donoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateDonoCode();
    }
  });
  
  donoInput.addEventListener('input', () => {
    if (validatedDono) {
      validatedDono = null;
      const resultDiv = document.getElementById('donoValidationResult');
      if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.className = 'dono-validation-result';
      }
      restoreOriginalTotals();
    }
  });
  
  console.log('✅ Validación Dono inicializada');
}

// ===== FUNCIÓN CORREGIDA - USA WINDOW.GETCARDTOTAL =====
function getCartTotalFromCart() {
  // Esta función llama a la función de cart.js, NO a sí misma
  if (typeof window.getCartTotal === 'function') {
    return window.getCartTotal();
  }
  console.warn('window.getCartTotal no está disponible');
  return 0;
}

// ===== VALIDATE DONO CODE =====
async function validateDonoCode() {
  const donoInput = document.getElementById('donoCode');
  const resultDiv = document.getElementById('donoValidationResult');
  const cartTotal = getCartTotalFromCart();
  
  if (!donoInput || !resultDiv) return;
  
  const code = donoInput.value.trim().toUpperCase();
  
  if (!code) {
    resultDiv.innerHTML = 'Ingresa un código Dono';
    resultDiv.className = 'dono-validation-result invalid';
    return;
  }
  
  resultDiv.innerHTML = 'Validando...';
  resultDiv.className = 'dono-validation-result info';
  
  try {
    const params = new URLSearchParams({
      action: 'VALIDATE_DONO',
      donoCode: code,
      cartAmount: cartTotal
    });
    
    const response = await fetch(DONO_CHECKOUT_SHEETS_CONFIG.webAppUrl, {
      method: 'POST',
      body: params
    });
    
    const result = await response.json();
    
    if (result.valid) {
      validatedDono = {
        code: code,
        balance: result.balance,
        valid: true
      };
      
      resultDiv.innerHTML = `
        <strong>✅ Código válido!</strong><br>
        Saldo disponible: ${formatPrice(result.balance)}<br>
        ${result.balance >= cartTotal 
          ? '🎉 Cubre el total de tu compra' 
          : `💡 Cubre ${formatPrice(result.balance)} del total`}
      `;
      resultDiv.className = 'dono-validation-result valid';
      
      applyDonoToCheckout();
      
    } else {
      validatedDono = null;
      resultDiv.innerHTML = `❌ ${result.error || 'Código inválido'}`;
      resultDiv.className = 'dono-validation-result invalid';
    }
    
  } catch (error) {
    console.error('Error validating Dono:', error);
    resultDiv.innerHTML = '❌ Error de conexión';
    resultDiv.className = 'dono-validation-result invalid';
  }
}

// ===== APPLY DONO TO CHECKOUT =====
function applyDonoToCheckout() {
  if (window.donoToApply) {
    showToast('Dono ya aplicado a este pedido', 'info');
    return;
  }
  
  if (!validatedDono) return;
  
  const cartTotal = getCartTotalFromCart();
  const subtotalSpan = document.getElementById('summarySubtotal');
  const totalSpan = document.getElementById('summaryTotal');
  
  if (!subtotalSpan || !totalSpan) return;
  
  if (!window.originalCartTotal) {
    window.originalCartTotal = cartTotal;
  }
  
  const donoBalance = validatedDono.balance;
  const newTotal = Math.max(0, cartTotal - donoBalance);
  const donoApplied = Math.min(donoBalance, cartTotal);
  
  subtotalSpan.innerHTML = formatPrice(cartTotal) + 
    `<span style="color: #27ae60; font-size: 0.9rem; margin-left: 10px;">(-${formatPrice(donoApplied)} Dono)</span>`;
  totalSpan.textContent = formatPrice(newTotal);
  
  window.donoToApply = {
    code: validatedDono.code,
    amount: donoApplied,
    remainingBalance: donoBalance - donoApplied,
    valid: true
  };
  
  if (newTotal === 0) {
    highlightDonoFullPayment();
  }
  
  showToast(`✅ Dono aplicado: ${formatPrice(donoApplied)}`, 'success');
}

function restoreOriginalTotals() {
  if (window.originalCartTotal) {
    const subtotalSpan = document.getElementById('summarySubtotal');
    const totalSpan = document.getElementById('summaryTotal');
    
    if (subtotalSpan) subtotalSpan.textContent = formatPrice(window.originalCartTotal);
    if (totalSpan) totalSpan.textContent = formatPrice(window.originalCartTotal);
    
    window.donoToApply = null;
  }
}

function highlightDonoFullPayment() {
  const donoMessage = document.createElement('div');
  donoMessage.className = 'dono-full-message';
  donoMessage.innerHTML = `
    <div style="
      background: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      text-align: center;
      border: 2px solid #c3e6cb;
    ">
      <strong>🎉 ¡Tu Dono cubre el total!</strong><br>
      No necesitas realizar pago adicional.
    </div>
  `;
  
  const actionsContainer = document.querySelector('.checkout-actions-new');
  if (actionsContainer) {
    const existing = document.querySelector('.dono-full-message');
    if (existing) existing.remove();
    
    actionsContainer.parentNode.insertBefore(donoMessage, actionsContainer);
  }
}

// ===== FORMAT PRICE =====
function formatPrice(price) {
  return '$' + Math.round(price).toLocaleString('es-CO');
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initDonoCheckout, 500);
});

// ===== EXPORT =====
window.validateDonoCode = validateDonoCode;
window.getValidatedDono = () => validatedDono;
window.clearDono = () => {
  validatedDono = null;
  restoreOriginalTotals();
};

console.log('✅ dono-checkout.js cargado v1.5');