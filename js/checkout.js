import { CONFIG } from './config.js';
import { showToast } from './ui.js';
import { addToCart, updateCartUI } from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('IMOLARTE – Main initialized');

  // Catalogue (always present)
  if (document.getElementById('products-grid')) {
    const { renderProducts, injectDonoButton } = await import('./catalog.js');
    renderProducts();
    injectDonoButton();
  }

  // Cart (lazy)
  if (document.getElementById('cartButton') || document.getElementById('cartPage')) {
    const { updateCartUI } = await import('./cart.js');
    updateCartUI();
  }

  // Dono (lazy)
  const donoBtn = document.getElementById('dono-mode-btn');
  if (donoBtn) {
    const { initDono } = await import('./dono.js');
    initDono();
  }

  // Checkout (lazy)
  if (document.getElementById('checkoutSection')) {
    const { initCheckout } = await import('./checkout.js');
    initCheckout();
  }
});