import { CONFIG } from './config.js';
import { showToast, createModal, formatPrice } from './ui.js';
import { addToCart } from './cart.js';

function openDonoModal() {
  const modal = createModal('Regala Crédito Exclusivo', `
    <!-- same modal content as before -->
  `);

  // ... same preset and add logic ...
}

export function initDono() {
  // Attach Dono button listener only when needed
  const btn = document.getElementById('dono-mode-btn');
  if (btn) btn.onclick = openDonoModal;
  console.log('Dono initialized');
}