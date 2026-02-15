/**
 * ================================================================
 * IMOLARTE - CART.JS
 * ================================================================
 * Gestión completa del carrito con timer
 * Compatible con products.js existente
 * Versión: 5.0 ESTABLE
 * ================================================================
 */

// ===== CONFIGURACIÓN =====

const CART_CONFIG = {
  EXPIRACION_MINUTOS: 15,
  AVISO_MINUTOS: 10,
  STORAGE_KEY: 'imolarte_cart',
  TIMER_KEY: 'imolarte_cart_timer'
};

// ===== VARIABLES GLOBALES =====

window.cart = [];
let cartTimer = null;
let cartTimerInterval = null;

// ===== FUNCIONES PRINCIPALES =====

/**
 * Agrega producto al carrito
 * Compatible con formato: addToCart(description, collection, code, price, quantity)
 */
function addToCart(description, collection, code, price, quantity) {
  // Validar parámetros
  if (!description || !collection || !code || price === undefined || !quantity) {
    console.error('addToCart: parámetros inválidos', {description, collection, code, price, quantity});
    return;
  }

  const product = {
    description: description,
    collection: collection,
    code: code,
    price: Number(price),
    quantity: Number(quantity)
  };

  // Buscar si ya existe
  const existingIndex = window.cart.findIndex(item => 
    item.code === product.code && item.collection === product.collection
  );

  if (existingIndex > -1) {
    window.cart[existingIndex].quantity += product.quantity;
  } else {
    window.cart.push(product);
  }

  saveCart();
  updateCartUI();

  console.log('✅ Producto agregado:', product.description);
}

/**
 * Elimina producto del carrito
 */
function removeFromCart(index) {
  if (index >= 0 && index < window.cart.length) {
    const producto = window.cart[index].description;
    window.cart.splice(index, 1);
    saveCart();
    updateCartUI();
    console.log('🗑️ Producto eliminado:', producto);
  }
}

/**
 * Actualiza cantidad de un producto
 */
function updateQuantity(index, newQuantity) {
  if (index >= 0 && index < window.cart.length) {
    if (newQuantity <= 0) {
      removeFromCart(index);
    } else {
      window.cart[index].quantity = parseInt(newQuantity);
      saveCart();
      updateCartUI();
    }
  }
}

/**
 * Calcula el total del carrito
 */
function getCartTotal() {
  return window.cart.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return total + (price * quantity);
  }, 0);
}

/**
 * Limpia el carrito completamente
 */
function clearCart() {
  window.cart = [];
  localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
  stopTimer();
  updateCartUI();
  console.log('🗑️ Carrito limpiado');
}

// ===== UI =====

/**
 * Actualiza la interfaz del carrito
 */
function updateCartUI() {
  updateCartCount();
  updateCartItems();
  updateCartTotal();
}

/**
 * Actualiza el contador del badge
 */
function updateCartCount() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = window.cart.length;
    badge.style.display = window.cart.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Actualiza los items del carrito
 */
function updateCartItems() {
  const container = document.getElementById('cartItems');
  if (!container) return;

  if (window.cart.length === 0) {
    container.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
    return;
  }

  container.innerHTML = window.cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${item.description}</h4>
        <p>${item.collection} - ${item.code}</p>
        <p class="cart-item-price">${formatPrice(item.price)}</p>
      </div>
      <div class="cart-item-controls">
        <input 
          type="number" 
          min="1" 
          value="${item.quantity}" 
          onchange="updateQuantity(${index}, this.value)"
          class="quantity-input"
        >
        <button onclick="removeFromCart(${index})" class="btn-remove" title="Eliminar">
          🗑️
        </button>
      </div>
      <div class="cart-item-subtotal">
        ${formatPrice(item.price * item.quantity)}
      </div>
    </div>
  `).join('');
}

/**
 * Actualiza el total del carrito
 */
function updateCartTotal() {
  const totalElement = document.getElementById('cartTotal');
  if (totalElement) {
    totalElement.textContent = formatPrice(getCartTotal());
  }
}

/**
 * Formatea precio
 */
function formatPrice(price) {
  const num = Number(price);
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('es-CO');
}

// ===== PERSISTENCIA =====

/**
 * Guarda el carrito en localStorage
 */
function saveCart() {
  try {
    localStorage.setItem(CART_CONFIG.STORAGE_KEY, JSON.stringify(window.cart));
    
    if (window.cart.length > 0) {
      if (!localStorage.getItem(CART_CONFIG.TIMER_KEY)) {
        startTimer();
      }
    } else {
      stopTimer();
    }
  } catch (e) {
    console.error('Error guardando carrito:', e);
  }
}

/**
 * Carga el carrito desde localStorage
 */
function loadCart() {
  try {
    const stored = localStorage.getItem(CART_CONFIG.STORAGE_KEY);
    if (stored) {
      window.cart = JSON.parse(stored);
      
      const tiempoRestante = getTimeRemaining();
      
      if (tiempoRestante <= 0 && window.cart.length > 0) {
        console.log('🗑️ Carrito expirado al cargar página');
        window.cart = [];
        localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
        localStorage.removeItem(CART_CONFIG.TIMER_KEY);
      } else if (window.cart.length > 0) {
        resumeTimer();
        console.log(`⏰ Carrito cargado: ${window.cart.length} items`);
      }
    }
  } catch (e) {
    console.error('Error cargando carrito:', e);
    window.cart = [];
  }
  
  updateCartUI();
}

// ===== TIMER =====

/**
 * Inicia el timer del carrito
 */
function startTimer() {
  const now = Date.now();
  localStorage.setItem(CART_CONFIG.TIMER_KEY, now.toString());
  
  stopTimer();
  
  const expTime = CART_CONFIG.EXPIRACION_MINUTOS * 60 * 1000;
  cartTimer = setTimeout(() => {
    expireCart();
  }, expTime);
  
  const warnTime = CART_CONFIG.AVISO_MINUTOS * 60 * 1000;
  setTimeout(() => {
    showWarning();
  }, warnTime);
  
  cartTimerInterval = setInterval(() => {
    updateTimerDisplay();
  }, 60000);
  
  console.log('⏰ Timer iniciado (15 min)');
}

/**
 * Reanuda el timer desde donde quedó
 */
function resumeTimer() {
  const inicio = localStorage.getItem(CART_CONFIG.TIMER_KEY);
  if (!inicio) {
    startTimer();
    return;
  }
  
  const elapsed = Date.now() - parseInt(inicio);
  const remaining = (CART_CONFIG.EXPIRACION_MINUTOS * 60 * 1000) - elapsed;
  
  if (remaining <= 0) {
    expireCart();
    return;
  }
  
  stopTimer();
  
  cartTimer = setTimeout(() => {
    expireCart();
  }, remaining);
  
  const warnTime = CART_CONFIG.AVISO_MINUTOS * 60 * 1000;
  if (elapsed < warnTime) {
    setTimeout(() => {
      showWarning();
    }, warnTime - elapsed);
  }
  
  cartTimerInterval = setInterval(() => {
    updateTimerDisplay();
  }, 60000);
}

/**
 * Detiene el timer
 */
function stopTimer() {
  if (cartTimer) {
    clearTimeout(cartTimer);
    cartTimer = null;
  }
  if (cartTimerInterval) {
    clearInterval(cartTimerInterval);
    cartTimerInterval = null;
  }
  localStorage.removeItem(CART_CONFIG.TIMER_KEY);
}

/**
 * Obtiene tiempo restante en minutos
 */
function getTimeRemaining() {
  const inicio = localStorage.getItem(CART_CONFIG.TIMER_KEY);
  if (!inicio) return 0;
  
  const elapsed = Date.now() - parseInt(inicio);
  const remaining = (CART_CONFIG.EXPIRACION_MINUTOS * 60 * 1000) - elapsed;
  
  return Math.max(0, Math.floor(remaining / 60000));
}

/**
 * Actualiza el display del timer
 */
function updateTimerDisplay() {
  const minutos = getTimeRemaining();
  const timerEl = document.getElementById('cart-timer');
  
  if (timerEl && window.cart.length > 0) {
    if (minutos > 0) {
      timerEl.textContent = `⏰ Expira en ${minutos} min`;
      timerEl.style.display = 'block';
      timerEl.style.color = minutos <= 5 ? '#e74c3c' : '#7f8c8d';
    } else {
      timerEl.style.display = 'none';
    }
  }
}

/**
 * Muestra aviso de expiración
 */
function showWarning() {
  if (window.cart.length === 0) return;
  
  alert('⚠️ Tu carrito expirará en 5 minutos');
  console.log('⚠️ Aviso: Carrito expira en 5 min');
}

/**
 * Expira el carrito
 */
function expireCart() {
  if (window.cart.length === 0) return;
  
  const count = window.cart.length;
  window.cart = [];
  localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
  stopTimer();
  updateCartUI();
  
  alert(`🗑️ Tu carrito de ${count} productos expiró`);
  console.log('🗑️ Carrito expirado');
}

// ===== CART PAGE =====

/**
 * Muestra la página del carrito
 */
function showCartPage() {
  const cartPage = document.getElementById('cartPage');
  if (cartPage) {
    cartPage.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCartUI();
  }
}

/**
 * Oculta la página del carrito
 */
function hideCartPage() {
  const cartPage = document.getElementById('cartPage');
  if (cartPage) {
    cartPage.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  
  // Botón del carrito
  const cartBtn = document.getElementById('cartButton');
  if (cartBtn) {
    cartBtn.addEventListener('click', showCartPage);
  }
  
  // Botón cerrar carrito
  const closeBtn = document.getElementById('closeCart');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideCartPage);
  }
  
  // Agregar timer al HTML si no existe
  const cartHeader = document.querySelector('.cart-header');
  if (cartHeader && !document.getElementById('cart-timer')) {
    const timerDiv = document.createElement('div');
    timerDiv.id = 'cart-timer';
    timerDiv.style.cssText = `
      font-size: 0.85rem;
      color: #7f8c8d;
      margin-top: 0.5rem;
      text-align: center;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
      display: none;
    `;
    cartHeader.appendChild(timerDiv);
    updateTimerDisplay();
  }
  
  console.log('✅ Sistema de carrito inicializado v5.0');
});

// ===== EXPORTAR FUNCIONES =====

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.getCartTotal = getCartTotal;
window.updateCartUI = updateCartUI;
window.clearCart = clearCart;
window.formatPrice = formatPrice;
window.showCartPage = showCartPage;
window.hideCartPage = hideCartPage;
