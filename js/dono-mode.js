/**
 * IMOLARTE - Dono Mode (Gift Card)
 * 
 * Features:
 * ✅ Catalog injection (first card position)
 * ✅ Amount selector (presets + custom)
 * ✅ Recipient form modal
 * ✅ WhatsApp share with pre-filled gift message
 * ✅ Backend logging to DONOS sheet
 * ✅ Unique Dono code generation
 * 
 * Backend: IMOLARTE-sistema (Bound Apps Script)
 * Web App: https://script.google.com/macros/s/AKfycbxaoRuG9JLeSh4EWpcfDg-k68WdjheklfoJ90P7LN3XiQ4B9V2ZTR1eBhxieo-N2Z5rLw/exec
 */

// === CONFIG ===
const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxaoRuG9JLeSh4EWpcfDg-k68WdjheklfoJ90P7LN3XiQ4B9V2ZTR1eBhxieo-N2Z5rLw/exec';

const DONO_CONFIG = {
  minAmount: 50000,
  maxAmount: 5000000,
  defaultAmount: 200000,
  whatsappNumber: '573004257367',
  validityMonths: 6
};

// === INJECT DONO CARD INTO CATALOG ===
function injectDonoButton() {
  const catalogGrid = document.querySelector('.products-grid') || document.getElementById('catalog');
  if (!catalogGrid) {
    console.warn('⚠️ Dono Mode: Catalog container not found');
    return;
  }
  
  // Prevent duplicate injection
  if (document.getElementById('dono-card-inject')) {
    return;
  }
  
  // Create Dono card element
  const donoCard = document.createElement('div');
  donoCard.id = 'dono-card-inject';
  donoCard.className = 'product-card dono-card';
  donoCard.innerHTML = `
    <div class="dono-preview">
      <div class="dono-icon">🎁</div>
      <h3>Dono Imolarte</h3>
      <p class="dono-desc">Tarjeta regalo para cerámicas italianas de lujo</p>
      
      <div class="dono-amount-selector">
        <button class="amount-btn" data-amount="100000">$100K</button>
        <button class="amount-btn active" data-amount="200000">$200K</button>
        <button class="amount-btn" data-amount="500000">$500K</button>
        <input type="number" id="dono-custom-amount" placeholder="Otro valor" 
               min="${DONO_CONFIG.minAmount}" max="${DONO_CONFIG.maxAmount}" step="10000">
      </div>
      
      <p class="dono-note">Válido por ${DONO_CONFIG.validityMonths} meses • Canjeable en todo el catálogo</p>
      
      <button id="dono-add-to-cart" class="btn-primary">Agregar como Dono 🎁</button>
    </div>
  `;
  
  // Insert as first card in catalog
  catalogGrid.insertBefore(donoCard, catalogGrid.firstChild);
  
  // === EVENT LISTENERS ===
  donoCard.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      donoCard.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const customInput = document.getElementById('dono-custom-amount');
      if (customInput) customInput.value = '';
    });
  });
  
  const customInput = document.getElementById('dono-custom-amount');
  if (customInput) {
    customInput.addEventListener('input', () => {
      donoCard.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    });
  }
  
  document.getElementById('dono-add-to-cart')?.addEventListener('click', handleDonoAddToCart);
}

// === HANDLE: Add Dono to Cart Flow ===
function handleDonoAddToCart() {
  const customInput = document.getElementById('dono-custom-amount');
  const selectedBtn = document.querySelector('.amount-btn.active');
  
  let amount = DONO_CONFIG.defaultAmount;
  
  if (customInput?.value) {
    amount = parseInt(customInput.value);
  } else if (selectedBtn?.dataset.amount) {
    amount = parseInt(selectedBtn.dataset.amount);
  }
  
  if (amount < DONO_CONFIG.minAmount || amount > DONO_CONFIG.maxAmount) {
    if (typeof showToast === 'function') {
      showToast(`Monto debe estar entre $${DONO_CONFIG.minAmount.toLocaleString('es-CO')} y $${DONO_CONFIG.maxAmount.toLocaleString('es-CO')}`, 'error');
    } else {
      alert(`Monto inválido. Mínimo: $${DONO_CONFIG.minAmount.toLocaleString()}, Máximo: $${DONO_CONFIG.maxAmount.toLocaleString()}`);
    }
    return;
  }
  
  showDonoModal(amount);
}

// === MODAL: Recipient Info Form ===
function showDonoModal(amount) {
  const modal = document.createElement('div');
  modal.className = 'dono-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="dono-modal-content">
      <button class="dono-modal-close" aria-label="Cerrar">&times;</button>
      
      <h3>🎁 Completar Dono</h3>
      <p class="dono-amount-display">Monto: <strong>$${amount.toLocaleString('es-CO')} COP</strong></p>
      
      <form id="dono-form">
        <label for="donor-name">Tu nombre *</label>
        <input type="text" id="donor-name" name="donor" required placeholder="Ej: María López">
        
        <label for="recipient-name">Nombre del destinatario *</label>
        <input type="text" id="recipient-name" name="recipient" required placeholder="Ej: Carlos Ramírez">
        
        <label for="recipient-phone">WhatsApp del destinatario *</label>
        <input type="tel" id="recipient-phone" name="phone" required placeholder="+57 300 123 4567" pattern="^\+?57\d{10}$">
        <small>Formato: +57 seguido de 10 dígitos</small>
        
        <label for="dono-message">Mensaje opcional (máx. 200 caracteres)</label>
        <textarea id="dono-message" name="message" maxlength="200" rows="3" placeholder="¡Feliz cumpleaños! / Gracias por todo..."></textarea>
        
        <div class="dono-actions">
          <button type="button" id="dono-cancel" class="btn-secondary">Cancelar</button>
          <button type="submit" class="btn-primary">Enviar por WhatsApp 💬</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // === MODAL EVENT HANDLERS ===
  modal.querySelector('.dono-modal-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  
  const onEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', onEscape);
    }
  };
  document.addEventListener('keydown', onEscape);
  
  document.getElementById('dono-cancel').addEventListener('click', () => modal.remove());
  
  document.getElementById('dono-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const donor = document.getElementById('donor-name').value.trim();
    const recipient = document.getElementById('recipient-name').value.trim();
    const phone = document.getElementById('recipient-phone').value.replace(/\D/g, '');
    const message = document.getElementById('dono-message').value.trim();
    
    const donoCode = `DONO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    
    sendDonoViaWhatsApp({ amount, donor, recipient, phone, message, donoCode });
    logDonoCreation({ donoCode, amount, donor, recipient, phone, message });
    
    modal.remove();
    if (typeof showToast === 'function') {
      showToast('🎁 Dono listo para enviar por WhatsApp', 'success');
    }
  });
}

// === WHATSAPP: Pre-filled Gift Message ===
function sendDonoViaWhatsApp({ amount, donor, recipient, phone, message, donoCode }) {
  const cleanPhone = phone.startsWith('57') ? phone : `57${phone.replace(/^\+?/, '')}`;
  
  const whatsappText = `
🎁 *Dono Imolarte* 🎁

Hola ${recipient}, 

${donor} te ha enviado un regalo especial:

💰 *Monto:* $${amount.toLocaleString('es-CO')} COP
🔖 *Código de canje:* ${donoCode}
📅 *Válido por:* ${DONO_CONFIG.validityMonths} meses

✉️ *Mensaje:*
"${message || '¡Disfruta tus cerámicas italianas de lujo!'}"

👉 *Cómo canjear:*
1. Visita: g-living.github.io/catalogo-imolarte
2. Elige tus productos favoritos
3. Al finalizar, ingresa el código: ${donoCode}

¿Tienes dudas? Responde a este mensaje.

Con cariño,
Imolarte Colombia 🇮🇹🇨🇴
  `.trim();
  
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// === BACKEND: Log Dono Creation (Async, Non-blocking) ===
async function logDonoCreation(data) {
  try {
    await fetch(APPS_SCRIPT_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'LOG_DONO',
        ...data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    });
    console.log('✅ Dono logged:', data.donoCode);
  } catch (err) {
    console.warn('⚠️ Could not log dono (non-critical):', err);
  }
}

// === INIT: Auto-inject on DOM Ready ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectDonoButton);
} else {
  injectDonoButton();
}

// === EXPORTS (for testing) ===
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    injectDonoButton,
    DONO_CONFIG
  };
}