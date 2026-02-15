/**
 * ================================================================
 * IMOLARTE - GESTIÓN COMPLETA DE CARRITO
 * ================================================================
 * Unifica cart.js + cart-manager.js
 * Incluye: timer, persistencia, notificaciones
 * Versión: 4.0 UNIFICADO
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

// ===== CARGAR CARRITO AL INICIO =====

/**
 * Carga el carrito guardado en localStorage
 */
function cargarCarritoGuardado() {
  try {
    const stored = localStorage.getItem(CART_CONFIG.STORAGE_KEY);
    if (stored) {
      window.cart = JSON.parse(stored);
      
      // Verificar si expiró
      const tiempoRestante = getTiempoRestante();
      
      if (tiempoRestante <= 0 && window.cart.length > 0) {
        console.log('🗑️ Carrito expirado al cargar página');
        window.cart = [];
        localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
        localStorage.removeItem(CART_CONFIG.TIMER_KEY);
      } else if (window.cart.length > 0) {
        // Reiniciar timer
        reanudarTimer();
        console.log(`⏰ Carrito cargado: ${window.cart.length} items, ${tiempoRestante} min restantes`);
      }
    }
  } catch (e) {
    console.error('Error cargando carrito:', e);
    window.cart = [];
  }
  
  updateCartUI();
}

// ===== GESTIÓN DE ITEMS =====

/**
 * Agrega producto al carrito
 */
function addToCart(product) {
  // Buscar si ya existe
  const existingIndex = window.cart.findIndex(item => 
    item.code === product.code && item.collection === product.collection
  );
  
  if (existingIndex > -1) {
    // Incrementar cantidad
    window.cart[existingIndex].quantity += product.quantity;
  } else {
    // Agregar nuevo
    window.cart.push(product);
  }
  
  guardarCarrito();
  updateCartUI();
  
  // Notificación
  mostrarNotificacionPush(
    `✅ ${product.description} agregado al carrito`,
    'success',
    3000
  );
  
  console.log('✅ Producto agregado:', product.description);
}

/**
 * Elimina producto del carrito
 */
function removeFromCart(index) {
  if (index >= 0 && index < window.cart.length) {
    const producto = window.cart[index].description;
    window.cart.splice(index, 1);
    guardarCarrito();
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
      guardarCarrito();
      updateCartUI();
    }
  }
}

/**
 * Calcula el total del carrito
 */
function getCartTotal() {
  return window.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ===== ACTUALIZAR UI =====

/**
 * Actualiza la interfaz del carrito
 */
function updateCartUI() {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const emptyMessage = document.getElementById('emptyCartMessage');
  const checkoutBtn = document.getElementById('checkoutBtn');
  
  // Contador
  if (cartCount) {
    cartCount.textContent = window.cart.length;
    cartCount.style.display = window.cart.length > 0 ? 'block' : 'none';
  }
  
  // Items
  if (cartItemsContainer) {
    if (window.cart.length === 0) {
      cartItemsContainer.innerHTML = '';
      if (emptyMessage) emptyMessage.style.display = 'block';
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      if (emptyMessage) emptyMessage.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = false;
      
      cartItemsContainer.innerHTML = window.cart.map((item, index) => `
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
            <button onclick="removeFromCart(${index})" class="btn-remove">🗑️</button>
          </div>
          <div class="cart-item-subtotal">
            ${formatPrice(item.price * item.quantity)}
          </div>
        </div>
      `).join('');
    }
  }
  
  // Total
  if (cartTotal) {
    cartTotal.textContent = formatPrice(getCartTotal());
  }
  
  // Timer
  actualizarDisplayTimer();
}

// ===== PERSISTENCIA =====

/**
 * Guarda el carrito en localStorage
 */
function guardarCarrito() {
  try {
    localStorage.setItem(CART_CONFIG.STORAGE_KEY, JSON.stringify(window.cart));
    
    if (window.cart.length > 0) {
      // Si hay items, iniciar timer si no existe
      if (!localStorage.getItem(CART_CONFIG.TIMER_KEY)) {
        iniciarTimer();
      }
    } else {
      // Si está vacío, limpiar timer
      detenerTimer();
    }
  } catch (e) {
    console.error('Error guardando carrito:', e);
  }
}

/**
 * Limpia el carrito completamente
 */
function limpiarCarritoCompletamente() {
  window.cart = [];
  localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
  detenerTimer();
  updateCartUI();
  
  console.log('🗑️ Carrito limpiado completamente');
}

// ===== TIMER =====

/**
 * Inicia el timer del carrito
 */
function iniciarTimer() {
  const ahora = Date.now();
  localStorage.setItem(CART_CONFIG.TIMER_KEY, ahora.toString());
  
  detenerTimer(); // Limpiar timers anteriores
  
  // Timer para limpiar a los 15 min
  const tiempoExpiracion = CART_CONFIG.EXPIRACION_MINUTOS * 60 * 1000;
  cartTimer = setTimeout(() => {
    limpiarPorExpiracion();
  }, tiempoExpiracion);
  
  // Aviso a los 10 min (faltan 5)
  const tiempoAviso = CART_CONFIG.AVISO_MINUTOS * 60 * 1000;
  setTimeout(() => {
    mostrarAvisoExpiracion();
  }, tiempoAviso);
  
  // Actualizar display cada minuto
  cartTimerInterval = setInterval(() => {
    actualizarDisplayTimer();
  }, 60000);
  
  console.log('⏰ Timer iniciado (15 min)');
}

/**
 * Reanuda el timer desde donde quedó
 */
function reanudarTimer() {
  const inicio = localStorage.getItem(CART_CONFIG.TIMER_KEY);
  if (!inicio) {
    iniciarTimer();
    return;
  }
  
  const transcurrido = Date.now() - parseInt(inicio);
  const restante = (CART_CONFIG.EXPIRACION_MINUTOS * 60 * 1000) - transcurrido;
  
  if (restante <= 0) {
    limpiarPorExpiracion();
    return;
  }
  
  detenerTimer();
  
  // Timer para el tiempo restante
  cartTimer = setTimeout(() => {
    limpiarPorExpiracion();
  }, restante);
  
  // Aviso si aún no pasaron 10 min
  const tiempoAviso = CART_CONFIG.AVISO_MINUTOS * 60 * 1000;
  if (transcurrido < tiempoAviso) {
    setTimeout(() => {
      mostrarAvisoExpiracion();
    }, tiempoAviso - transcurrido);
  }
  
  // Actualizar display cada minuto
  cartTimerInterval = setInterval(() => {
    actualizarDisplayTimer();
  }, 60000);
  
  console.log(`⏰ Timer reanudado (${Math.floor(restante / 60000)} min restantes)`);
}

/**
 * Detiene el timer
 */
function detenerTimer() {
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
function getTiempoRestante() {
  const inicio = localStorage.getItem(CART_CONFIG.TIMER_KEY);
  if (!inicio) return 0;
  
  const transcurrido = Date.now() - parseInt(inicio);
  const restante = (CART_CONFIG.EXPIRACION_MINUTOS * 60 * 1000) - transcurrido;
  
  return Math.max(0, Math.floor(restante / 60000));
}

/**
 * Actualiza el display del timer
 */
function actualizarDisplayTimer() {
  const minutos = getTiempoRestante();
  const timerElement = document.getElementById('cart-timer');
  
  if (timerElement && window.cart.length > 0) {
    if (minutos > 0) {
      timerElement.textContent = `⏰ Expira en ${minutos} min`;
      timerElement.style.display = 'block';
      
      if (minutos <= 5) {
        timerElement.style.color = '#e74c3c';
        timerElement.style.fontWeight = 'bold';
      } else {
        timerElement.style.color = '#7f8c8d';
        timerElement.style.fontWeight = 'normal';
      }
    } else {
      timerElement.style.display = 'none';
    }
  }
}

/**
 * Muestra aviso de que quedan 5 minutos
 */
function mostrarAvisoExpiracion() {
  if (window.cart.length === 0) return;
  
  mostrarNotificacionPush(
    '⚠️ Tu carrito expirará en 5 minutos',
    'warning',
    10000
  );
  
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
  
  console.log('⚠️ Aviso: Carrito expira en 5 min');
}

/**
 * Limpia el carrito por expiración
 */
function limpiarPorExpiracion() {
  if (window.cart.length === 0) return;
  
  const cantidadItems = window.cart.length;
  
  window.cart = [];
  localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
  detenerTimer();
  updateCartUI();
  
  mostrarNotificacionPush(
    `🗑️ Tu carrito de ${cantidadItems} productos expiró`,
    'info',
    8000
  );
  
  if ('vibrate' in navigator) {
    navigator.vibrate([300, 100, 300, 100, 300]);
  }
  
  console.log('🗑️ Carrito expirado - limpiado automáticamente');
}

// ===== NOTIFICACIONES =====

/**
 * Muestra notificación tipo push
 */
function mostrarNotificacionPush(mensaje, tipo = 'info', duracion = 5000) {
  const colores = {
    info: '#3498db',
    warning: '#f39c12',
    error: '#e74c3c',
    success: '#27ae60'
  };
  
  const notif = document.createElement('div');
  notif.className = 'cart-notification';
  notif.textContent = mensaje;
  notif.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${colores[tipo] || colores.info};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 100000;
    font-family: 'Lato', sans-serif;
    font-size: 0.95rem;
    max-width: 300px;
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, duracion);
}

// ===== FORMATEO =====

/**
 * Formatea precio en COP
 */
function formatPrice(price) {
  return '$' + price.toLocaleString('es-CO');
}

// ===== INICIALIZACIÓN =====

/**
 * Agregar timer al HTML del carrito
 */
function agregarTimerAlCarrito() {
  const cartHeader = document.querySelector('.cart h3');
  
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
    
    cartHeader.parentNode.insertBefore(timerDiv, cartHeader.nextSibling);
    actualizarDisplayTimer();
  }
}

// ===== ESTILOS CSS =====

const style = document.createElement('style');
style.textContent = `
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
document.head.appendChild(style);

// ===== AUTO-INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  cargarCarritoGuardado();
  agregarTimerAlCarrito();
  
  console.log('✅ Sistema de carrito inicializado v4.0');
});

// ===== EXPORTAR FUNCIONES =====

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.getCartTotal = getCartTotal;
window.updateCartUI = updateCartUI;
window.limpiarCarritoCompletamente = limpiarCarritoCompletamente;
window.formatPrice = formatPrice;

console.log('✅ Módulo de carrito unificado cargado');
