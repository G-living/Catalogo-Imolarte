/**
 * ================================================================
 * IMOLARTE - CART.JS CON TIMER
 * ================================================================
 * Carrito con funciones básicas + Timer de 15 minutos
 * Versión: 7.0 - TIMER IMPLEMENTADO
 * ================================================================
 */

// ===== VARIABLES GLOBALES =====

window.cart = [];

// Variables del timer
let cartTimer = null;
let cartStartTime = null;
const CART_DURATION = 15 * 60 * 1000; // 15 minutos en milisegundos
const WARNING_TIME = 10 * 60 * 1000; // 10 minutos para advertencia

// ===== FUNCIONES DE CARRITO =====

/**
 * Agrega producto al carrito
 */
function addToCart(description, collection, code, price, quantity) {
  // Buscar si ya existe
  const existingIndex = window.cart.findIndex(item => 
    item.code === code && item.collection === collection
  );

  if (existingIndex > -1) {
    window.cart[existingIndex].quantity += quantity;
  } else {
    window.cart.push({
      productName: description,
      collection: collection,
      code: code,
      price: Number(price),
      quantity: Number(quantity)
    });
  }

  // Iniciar timer si es el primer producto
  if (window.cart.length === 1 && quantity > 0) {
    startCartTimer();
  }

  updateCartUI();
  console.log('✅ Producto agregado:', description);
}

/**
 * Elimina un item del carrito
 */
function removeCartItem(code) {
  const index = window.cart.findIndex(item => item.code === code);
  if (index > -1) {
    window.cart.splice(index, 1);
    
    // Si el carrito queda vacío, detener timer
    if (window.cart.length === 0) {
      stopCartTimer();
    }
    
    updateCartUI();
    console.log('🗑️ Producto eliminado');
  }
}

/**
 * Actualiza la cantidad de un item
 */
function updateCartItemQuantity(code, newQuantity) {
  const item = window.cart.find(item => item.code === code);
  if (item) {
    if (newQuantity <= 0) {
      removeCartItem(code);
    } else {
      item.quantity = Number(newQuantity);
      updateCartUI();
    }
  }
}

/**
 * Calcula el total del carrito
 */
function getCartTotal() {
  return window.cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

/**
 * Formatea precio
 */
function formatPrice(price) {
  const num = Number(price);
  if (isNaN(num)) return '$0';
  return '$' + num.toLocaleString('es-CO');
}

// ===== TIMER DEL CARRITO =====

/**
 * Inicia el timer del carrito
 */
function startCartTimer() {
  // Limpiar timer previo si existe
  if (cartTimer) {
    clearInterval(cartTimer);
  }

  cartStartTime = Date.now();
  console.log('⏱️ Timer del carrito iniciado (15 minutos)');

  // Actualizar cada segundo
  cartTimer = setInterval(() => {
    const elapsed = Date.now() - cartStartTime;
    const remaining = CART_DURATION - elapsed;

    if (remaining <= 0) {
      // Tiempo expirado - vaciar carrito
      expireCart();
    } else if (remaining <= (CART_DURATION - WARNING_TIME) && remaining > (CART_DURATION - WARNING_TIME - 1000)) {
      // Advertencia a los 10 minutos (5 minutos restantes)
      showTimerWarning();
    }

    updateTimerDisplay(remaining);
  }, 1000);
}

/**
 * Detiene el timer del carrito
 */
function stopCartTimer() {
  if (cartTimer) {
    clearInterval(cartTimer);
    cartTimer = null;
    cartStartTime = null;
    console.log('⏱️ Timer detenido');
  }
  
  // Ocultar display del timer
  const timerDisplay = document.getElementById('cartTimer');
  if (timerDisplay) {
    timerDisplay.style.display = 'none';
  }
}

/**
 * Actualiza el display del timer
 */
function updateTimerDisplay(remaining) {
  const timerDisplay = document.getElementById('cartTimer');
  if (!timerDisplay) return;

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  timerDisplay.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
  timerDisplay.style.display = 'block';

  // Cambiar color según tiempo restante
  if (remaining < 3 * 60 * 1000) {
    // Últimos 3 minutos - rojo
    timerDisplay.style.color = '#e74c3c';
    timerDisplay.style.fontWeight = 'bold';
  } else if (remaining < 5 * 60 * 1000) {
    // Entre 3-5 minutos - naranja
    timerDisplay.style.color = '#f39c12';
  } else {
    // Más de 5 minutos - normal
    timerDisplay.style.color = '#7f8c8d';
  }
}

/**
 * Muestra advertencia cuando quedan 5 minutos
 */
function showTimerWarning() {
  showNotification('⏰ Quedan 5 minutos para completar tu pedido', 'warning', 5000);
  console.log('⚠️ Advertencia: 5 minutos restantes');
}

/**
 * Expira el carrito y lo vacía
 */
function expireCart() {
  console.log('⏰ Carrito expirado - vaciando...');
  
  stopCartTimer();
  window.cart = [];
  updateCartUI();
  
  showNotification('⏰ Tu carrito ha expirado por inactividad. Por favor, vuelve a agregar los productos.', 'error', 8000);
  
  // Cerrar página del carrito si está abierta
  hideCartPage();
}

/**
 * Reinicia el timer (cuando se modifica el carrito)
 */
function resetCartTimer() {
  if (window.cart.length > 0 && cartTimer) {
    cartStartTime = Date.now();
    console.log('🔄 Timer reiniciado');
  }
}

// ===== UI DEL CARRITO =====

/**
 * Actualiza toda la UI del carrito
 */
function updateCartUI() {
  updateCartCount();
  updateCartPage();
}

/**
 * Actualiza el badge del contador
 */
function updateCartCount() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = window.cart.length;
    badge.style.display = window.cart.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Actualiza la página del carrito
 */
function updateCartPage() {
  const itemsContainer = document.getElementById('cartItems');
  const summaryContainer = document.getElementById('cartSummary');

  if (!itemsContainer || !summaryContainer) return;

  if (window.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <p class="empty-text">Tu carrito está vacío</p>
      </div>
    `;
    summaryContainer.innerHTML = '';
    return;
  }

  // Renderizar items
  const itemsHTML = window.cart.map(item => {
    const comodinImage = getComodinImage(item.collection);
    const subtotal = item.price * item.quantity;

    return `
      <div class="cart-item" data-code="${item.code}">
        <img src="${comodinImage}" 
             alt="${item.collection}" 
             class="cart-item-image"
             onerror="this.style.display='none'">
        <div class="cart-item-details">
          <h3 class="cart-item-title">${item.productName}</h3>
          <p class="cart-item-collection">${item.collection}</p>
          <p class="cart-item-code">${item.code}</p>
        </div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-qty">
          <button type="button" 
                  class="qty-btn" 
                  onclick="updateCartItemQuantity('${item.code}', ${item.quantity - 1})"
                  aria-label="Disminuir">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button type="button" 
                  class="qty-btn" 
                  onclick="updateCartItemQuantity('${item.code}', ${item.quantity + 1})"
                  aria-label="Aumentar">+</button>
        </div>
        <div class="cart-item-subtotal">${formatPrice(subtotal)}</div>
        <button type="button" 
                class="cart-item-remove" 
                onclick="removeCartItem('${item.code}')"
                aria-label="Eliminar">
          <span>🗑️</span>
        </button>
      </div>
    `;
  }).join('');

  itemsContainer.innerHTML = itemsHTML;

  // Renderizar resumen
  const total = getCartTotal();
  const itemCount = window.cart.reduce((sum, item) => sum + item.quantity, 0);

  summaryContainer.innerHTML = `
    <div class="cart-summary">
      <div id="cartTimer" style="
        text-align: center;
        font-size: 1.2rem;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background: #f8f9fa;
        border-radius: 8px;
        display: none;
      "></div>
      <div class="cart-summary-row">
        <span>Productos:</span>
        <span>${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}</span>
      </div>
      <div class="cart-summary-row total">
        <span>Total:</span>
        <span>${formatPrice(total)}</span>
      </div>
      <div class="cart-summary-actions">
        <button type="button" class="btn btn-checkout" onclick="openCheckoutModal()">
          CHECKOUT
        </button>
      </div>
    </div>
  `;
}

/**
 * Obtiene imagen comodín por colección
 * Usa la función global si existe, sino usa el fallback
 */
function getComodinImage(collection) {
  // Si products.js ya definió esta función, usarla
  if (window.getComodinImage && window.getComodinImage !== getComodinImage) {
    return window.getComodinImage(collection);
  }
  
  // Fallback por si acaso
  const cleanName = collection.replace(/ /g, '_').replace(/\//g, '_');
  return `images/comodines/${cleanName}.png`;
}

// ===== NOTIFICACIONES =====

/**
 * Muestra una notificación
 */
function showNotification(message, type = 'success', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  
  const colors = {
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 30px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: 'Lato', sans-serif;
    font-weight: 600;
    max-width: 350px;
    animation: slideInRight 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// ===== MOSTRAR/OCULTAR CARRITO =====

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

  console.log('✅ Cart v7.0 inicializado con timer');
});

// ===== ANIMACIONES CSS =====
// Crear estilos de animación solo si no existen
if (!document.getElementById('cart-animations-v7')) {
  const cartStyle = document.createElement('style');
  cartStyle.id = 'cart-animations-v7';
  cartStyle.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(cartStyle);
}

// ===== EXPORTAR FUNCIONES =====

window.addToCart = addToCart;
window.removeCartItem = removeCartItem;
window.updateCartItemQuantity = updateCartItemQuantity;
window.getCartTotal = getCartTotal;
window.formatPrice = formatPrice;
window.updateCartUI = updateCartUI;
window.showCartPage = showCartPage;
window.hideCartPage = hideCartPage;
window.resetCartTimer = resetCartTimer;
window.stopCartTimer = stopCartTimer;
