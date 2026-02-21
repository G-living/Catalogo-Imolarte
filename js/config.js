// js/config.js
// IMOLARTE - Configuración Global

export const CONFIG = {
  // URLs Base (SIN espacios al final)
  BASE_URL: 'https://g-living.github.io/catalogo-imolarte',
  IMAGE_BASE_URL: 'https://g-living.github.io/catalogo-imolarte/images/',
  COMODINES_BASE_URL: 'https://g-living.github.io/catalogo-imolarte/comodines/',

  // Google Apps Script Backend
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec',

  // Wompi Payment Gateway
  WOMPI_PUBLIC_KEY: 'pub_test_rT7K8rzYnk2Ec8Lv25tRL3JIof6b6Lwp',
  WOMPI_SIGNATURE_URL: 'https://imolarte-signature-generator.filippo-massara2016.workers.dev/sign',

  // WhatsApp Fallback
  WHATSAPP_NUMBER: '573004257367',

  // Precios
  PRICING_MULTIPLIER: 12600,
  MIN_DONO_AMOUNT: 50000,

  // DONO
  DONO_PREFIX: 'DNO-',

  // Referidos
  REFERRAL_CREDIT_PERCENT: 0.01,

  // UI
  CART_INACTIVITY_MINUTES: 10,
  CART_WARNING_MINUTES: 3
};

export default CONFIG;