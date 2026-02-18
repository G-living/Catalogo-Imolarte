/**
 * dono.js - Modo Dono: Compra de crédito para regalar
 * Genera códigos de 10 caracteres alfanuméricos con prefijo DNO-
 * Versión: 1.1 - Fixed cart item creation
 */

// ===== CONFIGURATION =====
const DONO_CONFIG = {
  prefix: 'DNO-',
  codeLength: 10,
  expirationDays: 365,
  minAmount: 50000,
  maxPerOrder: 5
};

const SHEETS_CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec'
};

// ===== STATE =====
let selectedDonoAmount = 0;

// ===== INITIALIZE DONO MODAL =====
function initDonoModal() {
  console.log('🎁 Inicializando Modo Dono...');
  
  const donoButton = document.getElementById('donoButton');
  const closeDonoModal = document.getElementById('closeDonoModal');
  const cancelDono = document.getElementById('cancelDono');
  const addDonoToCart = document.getElementById('addDonoToCart');
  const donoModal = document.getElementById('donoModal');
  
  if (!donoButton || !donoModal) {
    console.error('Elementos Dono no encontrados');
    return;
  }
  
  // Open modal
  donoButton.addEventListener('click', () => {
    openDonoModal();
  });
  
  // Close modal
  const closeFunctions = [closeDonoModal, cancelDono];
  closeFunctions.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        closeDonoModal();
      });
    }
  });
  
  // Click outside to close
  donoModal.addEventListener('click', (e) => {
    if (e.target === donoModal) {
      closeDonoModal();
    }
  });
  
  // Add to cart
  if (addDonoToCart) {
    addDonoToCart.addEventListener('click', handleAddDonoToCart);
  }
  
  // Preset amounts
  document.querySelectorAll('.dono-preset').forEach(btn => {
    btn.addEventListener('click', function() {
      const amount = parseInt(this.dataset.amount);
      selectDonoAmount(amount);
      
      // Remove selected class from all presets
      document.querySelectorAll('.dono-preset').forEach(p => p.classList.remove('selected'));
      this.classList.add('selected');
      
      // Clear custom amount
      const customInput = document.getElementById('donoCustomAmount');
      if (customInput) customInput.value = '';
    });
  });
  
  // Custom amount
  const customInput = document.getElementById('donoCustomAmount');
  if (customInput) {
    customInput.addEventListener('input', function() {
      const amount = parseInt(this.value);
      if (amount >= DONO_CONFIG.minAmount) {
        selectDonoAmount(amount);
        
        // Remove selected class from presets
        document.querySelectorAll('.dono-preset').forEach(p => p.classList.remove('selected'));
      }
    });
  }
  
  console.log('✅ Modo Dono inicializado');
}

// ===== OPEN MODAL =====
function openDonoModal() {
  const modal = document.getElementById('donoModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    resetDonoForm();
  }
}

// ===== CLOSE MODAL =====
function closeDonoModal() {
  const modal = document.getElementById('donoModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ===== RESET FORM =====
function resetDonoForm() {
  document.getElementById('donoRecipientName').value = '';
  document.getElementById('donoRecipientEmail').value = '';
  document.getElementById('donoRecipientPhone').value = '';
  document.getElementById('donoCustomAmount').value = '';
  document.getElementById('donoMessage').value = '';
  
  document.querySelectorAll('.dono-preset').forEach(p => p.classList.remove('selected'));
  selectedDonoAmount = 0;
  updateDonoTotal();
}

// ===== SELECT AMOUNT =====
function selectDonoAmount(amount) {
  if (amount < DONO_CONFIG.minAmount) {
    showToast(`El monto mínimo es ${formatPrice(DONO_CONFIG.minAmount)}`, 'warning');
    return;
  }
  selectedDonoAmount = amount;
  updateDonoTotal();
}

// ===== UPDATE TOTAL =====
function updateDonoTotal() {
  const totalSpan = document.getElementById('donoTotalAmount');
  if (totalSpan) {
    totalSpan.textContent = formatPrice(selectedDonoAmount);
  }
}

// ===== GENERATE 10-CHARACTER CODE =====
function generateDonoCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < DONO_CONFIG.codeLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return DONO_CONFIG.prefix + result;
}

// ===== ADD DONO TO CART =====
async function handleAddDonoToCart() {
  // Validate amount
  if (selectedDonoAmount < DONO_CONFIG.minAmount) {
    showToast(`Selecciona un monto mínimo de ${formatPrice(DONO_CONFIG.minAmount)}`, 'error');
    return;
  }
  
  // Validate recipient name
  const recipientName = document.getElementById('donoRecipientName').value.trim();
  if (!recipientName) {
    showToast('Ingresa el nombre del beneficiario', 'error');
    document.getElementById('donoRecipientName').focus();
    return;
  }
  
  // Get optional fields
  const recipientEmail = document.getElementById('donoRecipientEmail').value.trim();
  const recipientPhone = document.getElementById('donoRecipientPhone').value.trim();
  const message = document.getElementById('donoMessage').value.trim();
  
  // Generate Dono code
  const donoCode = generateDonoCode();
  
  // Create complete Dono item first (FIXED)
  const donoItem = {
    productName: '🎁 Crédito Dono',
    description: `Crédito para ${recipientName}`,
    collection: 'DONO',
    code: donoCode,
    price: selectedDonoAmount,
    quantity: 1,
    isDono: true,
    recipientName: recipientName,
    recipientEmail: recipientEmail,
    recipientPhone: recipientPhone,
    message: message,
    donoCode: donoCode
  };
  
  // Add to cart using the existing function
  if (typeof window.addToCart === 'function') {
    // Call addToCart with basic params
    window.addToCart(
      donoItem.productName,
      donoItem.collection,
      donoItem.code,
      donoItem.price,
      donoItem.quantity
    );
    
    // Find the newly added item and enhance it with Dono data
    const addedItem = window.cart.find(item => item.code === donoCode);
    if (addedItem) {
      Object.assign(addedItem, donoItem);
    }
    
    showToast(`✅ Dono agregado: ${formatPrice(selectedDonoAmount)}`, 'success');
    closeDonoModal();
  } else {
    console.error('cart.js no disponible');
    showToast('Error al agregar al carrito', 'error');
  }
}

// ===== REGISTER DONO PURCHASE IN SHEETS =====
async function registerDonoPurchase(donoData, pedidoId) {
  try {
    const params = new URLSearchParams({
      action: 'PURCHASE_DONO',
      amount: donoData.amount,
      issuerClientId: donoData.clienteId || '',
      recipientName: donoData.recipientName,
      recipientEmail: donoData.recipientEmail || '',
      recipientPhone: donoData.recipientPhone || '',
      pedidoId: pedidoId
    });
    
    const response = await fetch(SHEETS_CONFIG.webAppUrl, {
      method: 'POST',
      body: params
    });
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Error registering Dono:', error);
    return { success: false };
  }
}

// ===== FORMAT PRICE =====
function formatPrice(price) {
  return '$' + Math.round(price).toLocaleString('es-CO');
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
  initDonoModal();
});

// ===== EXPORT =====
window.openDonoModal = openDonoModal;
window.closeDonoModal = closeDonoModal;
window.generateDonoCode = generateDonoCode;
window.registerDonoPurchase = registerDonoPurchase;

console.log('✅ dono.js cargado v1.1');