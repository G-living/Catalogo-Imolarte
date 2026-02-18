/**
 * dono-checkout.js - Validación y aplicación de códigos Dono en checkout
 * Versión: 1.0
 */

// ===== CONFIGURATION =====
const SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec'
};

// ===== STATE =====
let validatedDono = null; // { code, balance, valid }

// ===== INITIALIZE =====
function initDonoCheckout() {
  console.log('🎁 Inicializando validación Dono en checkout...');
  
  const validateBtn = document.getElementById('validateDonoBtn');
  const donoInput = document.getElementById('donoCode');
  
  if (!validateBtn || !donoInput) {
    console.warn('Elementos Dono no encontrados en checkout');
    return;
  }
  
  // Validate button click
  validateBtn.addEventListener('click', validateDonoCode);
  
  // Also validate on Enter key
  donoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateDonoCode();
    }
  });
  
  // Clear validation when input changes
  donoInput.addEventListener('input', () => {
    if (validatedDono) {
      validatedDono = null;
      const resultDiv = document.getElementById('donoValidationResult');
      if (resultDiv) {
        resultDiv.innerHTML = '';
        resultDiv.className = 'dono-validation-result';
      }
    }
  });
  
  console.log('✅ Validación Dono inicializada');
}

// ===== VALIDATE DONO CODE =====
async function validateDonoCode() {
  const donoInput = document.getElementById('donoCode');
  const resultDiv = document.getElementById('donoValidationResult');
  const cartTotal = getCartTotal();
  
  if (!donoInput || !resultDiv) return;
  
  const code = donoInput.value.trim().toUpperCase();
  
  if (!code) {
    resultDiv.innerHTML = 'Ingresa un código Dono';
    resultDiv.className = 'dono-validation-result invalid';
    return;
  }
  
  // Show loading
  resultDiv.innerHTML = 'Validando...';
  resultDiv.className = 'dono-validation-result info';
  
  try {
    const params = new URLSearchParams({
      action: 'VALIDATE_DONO',
      donoCode: code,
      cartAmount: cartTotal
    });
    
    const response = await fetch(SHEETS_CONFIG.webAppUrl, {
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
      
      // Update checkout totals
      applyDonoToCheckout();
      
    } else {
      validatedDono = null;
      resultDiv.innerHTML = `❌ ${result.error || 'Código inválido'}`;
      resultDiv.className = 'dono-validation-result invalid';
    }
    
  } catch (error) {
    console.error('Error validating Dono:', error);
    resultDiv