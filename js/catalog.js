// js/catalog.js
// IMOLARTE - Catálogo de Productos Garofano Blu
// Precios: EUR × 12600 = COP | Imágenes: /images/{SKU}.jpg

import { CONFIG } from './config.js';
import { addToCart } from './cart.js';
import { formatPrice } from './ui.js';

// ============================================================================
// GAROFANO BLU COLLECTION - 106 PRODUCTOS
// Precios convertidos: EUR × 12600 = COP
// Imágenes: https://github.com/G-living/catalogo-imolarte/tree/main/images
// ============================================================================

const GAROFANO_BLU = [
  { code: 'GB110', name: 'New appetizer plate', collection: 'Garofano Blu', priceEur: 64.20, price: 808920 },
  { code: 'GB001', name: 'Small jam jar', collection: 'Garofano Blu', priceEur: 37.51, price: 472651 },
  { code: 'GB002', name: 'Large jam jar', collection: 'Garofano Blu', priceEur: 42.56, price: 536256 },
  { code: 'GB003', name: 'Small serving boat', collection: 'Garofano Blu', priceEur: 69.97, price: 881597 },
  { code: 'GB004', name: 'Large serving boat', collection: 'Garofano Blu', priceEur: 79.34, price: 999734 },
  { code: 'GB005', name: 'Wine mug', collection: 'Garofano Blu', priceEur: 29.58, price: 372658 },
  { code: 'GB006', name: 'Biscuit bowl', collection: 'Garofano Blu', priceEur: 77.18, price: 972518 },
  { code: 'GB007', name: 'Jug 0.25', collection: 'Garofano Blu', priceEur: 33.90, price: 427190 },
  { code: 'GB008', name: 'Jug 0.50', collection: 'Garofano Blu', priceEur: 38.23, price: 481723 },
  { code: 'GB009', name: 'Jug 1.00', collection: 'Garofano Blu', priceEur: 44.00, price: 554400 },
  { code: 'GB010', name: 'Jug 1.50', collection: 'Garofano Blu', priceEur: 47.61, price: 599861 },
  { code: 'GB011', name: 'Jug 2.00', collection: 'Garofano Blu', priceEur: 50.49, price: 636149 },
  { code: 'GB016', name: 'Coffee pot x 6', collection: 'Garofano Blu', priceEur: 63.50, price: 800147 },
  { code: 'GB017', name: 'Coffee pot x 12', collection: 'Garofano Blu', priceEur: 80.06, price: 1008806 },
  { code: 'GB018', name: 'Candlestick with handle', collection: 'Garofano Blu', priceEur: 38.95, price: 490795 },
  { code: 'GB019', name: 'New candlestick', collection: 'Garofano Blu', priceEur: 36.78, price: 463478 },
  { code: 'GB020', name: 'Bowl - 15 cm', collection: 'Garofano Blu', priceEur: 23.80, price: 299880 },
  { code: 'GB021', name: 'Bowl - 17 cm', collection: 'Garofano Blu', priceEur: 26.69, price: 336269 },
  { code: 'GB022', name: 'Central appetizer bowl', collection: 'Garofano Blu', priceEur: 25.97, price: 327197 },
  { code: 'GB023', name: 'Side appetizer bowl', collection: 'Garofano Blu', priceEur: 24.53, price: 309053 },
  { code: 'GB024', name: 'Side ice cream bowl', collection: 'Garofano Blu', priceEur: 31.02, price: 390802 },
  { code: 'GB025', name: 'Small fruit bowl', collection: 'Garofano Blu', priceEur: 26.69, price: 336269 },
  { code: 'GB026', name: 'Medium fruit bowl', collection: 'Garofano Blu', priceEur: 40.39, price: 508939 },
  { code: 'GB027', name: 'Large fruit bowl', collection: 'Garofano Blu', priceEur: 48.33, price: 608933 },
  { code: 'GB028', name: 'Crudités bowl', collection: 'Garofano Blu', priceEur: 23.08, price: 290808 },
  { code: 'GB029', name: 'Small oval-shaped bowl', collection: 'Garofano Blu', priceEur: 26.69, price: 336269 },
  { code: 'GB030', name: 'Medium oval-shaped bowl', collection: 'Garofano Blu', priceEur: 31.74, price: 399874 },
  { code: 'GB031', name: 'Large oval-shaped bowl', collection: 'Garofano Blu', priceEur: 38.23, price: 481723 },
  { code: 'GB032', name: 'Small rectangular-shaped bowl', collection: 'Garofano Blu', priceEur: 25.97, price: 327197 },
  { code: 'GB033', name: 'Medium rectangular-shaped bowl', collection: 'Garofano Blu', priceEur: 31.02, price: 390802 },
  { code: 'GB034', name: 'Large rectangular-shaped bowl', collection: 'Garofano Blu', priceEur: 37.51, price: 472651 },
  { code: 'GB035', name: 'Small spaghetti bowl', collection: 'Garofano Blu', priceEur: 38.95, price: 490795 },
  { code: 'GB036', name: 'Large spaghetti bowl', collection: 'Garofano Blu', priceEur: 63.50, price: 800147 },
  { code: 'GB037', name: 'Spoon', collection: 'Garofano Blu', priceEur: 17.31, price: 218131 },
  { code: 'GB038', name: 'Small hexagonal plate', collection: 'Garofano Blu', priceEur: 24.53, price: 309053 },
  { code: 'GB039', name: 'Large hexagonal plate', collection: 'Garofano Blu', priceEur: 51.94, price: 654394 },
  { code: 'GB040', name: 'Cheese bowl with cover', collection: 'Garofano Blu', priceEur: 56.98, price: 718000 },
  { code: 'GB041', name: 'Cheese bowl', collection: 'Garofano Blu', priceEur: 44.72, price: 563472 },
  { code: 'GB042', name: 'Strawberry bowl', collection: 'Garofano Blu', priceEur: 46.16, price: 581616 },
  { code: 'GB109', name: 'New fruit bowl with handles', collection: 'Garofano Blu', priceEur: 62.03, price: 781603 },
  { code: 'GB044', name: 'Shallow fruit bowl with feet', collection: 'Garofano Blu', priceEur: 59.87, price: 754387 },
  { code: 'GB045', name: 'High fruit bowl - 30 cm diameter', collection: 'Garofano Blu', priceEur: 74.30, price: 936130 },
  { code: 'GB046', name: 'High salad bowl, diameter 33 cm', collection: 'Garofano Blu', priceEur: 77.90, price: 981590 },
  { code: 'GB047', name: 'Oval salad bowl', collection: 'Garofano Blu', priceEur: 41.84, price: 527184 },
  { code: 'GB048', name: 'Milk jug - 10 cm', collection: 'Garofano Blu', priceEur: 31.74, price: 399874 },
  { code: 'GB049', name: 'Milk jug - 12 cm', collection: 'Garofano Blu', priceEur: 36.06, price: 454406 },
  { code: 'GB050', name: 'Milk jug - 16 cm', collection: 'Garofano Blu', priceEur: 42.56, price: 536256 },
  { code: 'GB051', name: 'Milk jug - 18 cm', collection: 'Garofano Blu', priceEur: 51.22, price: 645322 },
  { code: 'GB052', name: 'Half-moon plate', collection: 'Garofano Blu', priceEur: 31.02, price: 390802 },
  { code: 'GB053', name: 'Oval dish 16x22', collection: 'Garofano Blu', priceEur: 31.74, price: 399874 },
  { code: 'GB054', name: 'Oval dish 28x21', collection: 'Garofano Blu', priceEur: 38.95, price: 490795 },
  { code: 'GB055', name: 'Oval dish 32x24', collection: 'Garofano Blu', priceEur: 41.11, price: 518011 },
  { code: 'GB056', name: 'Oval dish 38x30', collection: 'Garofano Blu', priceEur: 46.16, price: 581616 },
  { code: 'GB057', name: 'Oval dish 45x36', collection: 'Garofano Blu', priceEur: 52.66, price: 663466 },
  { code: 'GB058', name: 'Small oval fish dish', collection: 'Garofano Blu', priceEur: 40.39, price: 508939 },
  { code: 'GB059', name: 'Large oval fish dish', collection: 'Garofano Blu', priceEur: 93.05, price: 1172405 },
  { code: 'GB060', name: 'Saucer for small coffee cup', collection: 'Garofano Blu', priceEur: 20.92, price: 263592 },
  { code: 'GB061', name: 'Saucer for tea cup', collection: 'Garofano Blu', priceEur: 22.36, price: 281736 },
  { code: 'GB062', name: 'Saucer for large coffee cup', collection: 'Garofano Blu', priceEur: 23.80, price: 299880 },
  { code: 'GB063', name: 'Smooth saucer for large cup with handle', collection: 'Garofano Blu', priceEur: 23.80, price: 299880 },
  { code: 'GB064', name: 'Regular saucer for large cup without handle', collection: 'Garofano Blu', priceEur: 27.41, price: 345341 },
  { code: 'GB065', name: 'Saucer for English tea cup', collection: 'Garofano Blu', priceEur: 36.06, price: 454406 },
  { code: 'GB066', name: 'Plate - 15 cm', collection: 'Garofano Blu', priceEur: 28.13, price: 354413 },
  { code: 'GB067', name: 'Plate - 19 cm', collection: 'Garofano Blu', priceEur: 28.86, price: 363586 },
  { code: 'GB068', name: 'Plate - 22 cm', collection: 'Garofano Blu', priceEur: 31.02, price: 390802 },
  { code: 'GB069', name: 'Flat plate - 25 cm', collection: 'Garofano Blu', priceEur: 36.06, price: 454406 },
  { code: 'GB070', name: 'Deep plate - 25 cm', collection: 'Garofano Blu', priceEur: 38.95, price: 490795 },
  { code: 'GB071', name: 'Deep serving dish - 28 cm', collection: 'Garofano Blu', priceEur: 44.72, price: 563472 },
  { code: 'GB072', name: 'Deep appetizer plate', collection: 'Garofano Blu', priceEur: 23.08, price: 290808 },
  { code: 'GB073', name: 'Stew dish with lid', collection: 'Garofano Blu', priceEur: 183.22, price: 2308522 },
  { code: 'GB074', name: 'Oil and vinegar set', collection: 'Garofano Blu', priceEur: 141.38, price: 1781338 },
  { code: 'GB075', name: 'Face powder dish', collection: 'Garofano Blu', priceEur: 31.74, price: 399874 },
  { code: 'GB076', name: 'Jewellery box', collection: 'Garofano Blu', priceEur: 35.34, price: 445334 },
  { code: 'GB077', name: 'Comb holder', collection: 'Garofano Blu', priceEur: 46.16, price: 581616 },
  { code: 'GB078', name: 'Soap dish', collection: 'Garofano Blu', priceEur: 36.06, price: 454406 },
  { code: 'GB079', name: 'Bread stick holder', collection: 'Garofano Blu', priceEur: 28.13, price: 354413 },
  { code: 'GB108', name: 'Spoon holder', collection: 'Garofano Blu', priceEur: 23.80, price: 299880 },
  { code: 'GB080', name: 'Tooth pick holder', collection: 'Garofano Blu', priceEur: 20.20, price: 254520 },
  { code: 'GB081', name: 'Egg cup', collection: 'Garofano Blu', priceEur: 33.90, price: 427190 },
  { code: 'GB082', name: 'Salt pot', collection: 'Garofano Blu', priceEur: 47.61, price: 599861 },
  { code: 'GB083', name: 'Sauce boat', collection: 'Garofano Blu', priceEur: 48.33, price: 608933 },
  { code: 'GB111', name: 'Lemon squeezer', collection: 'Garofano Blu', priceEur: 19.47, price: 245347 },
  { code: 'GB084', name: 'Small coffee cup', collection: 'Garofano Blu', priceEur: 28.13, price: 354413 },
  { code: 'GB085', name: 'Tea cup', collection: 'Garofano Blu', priceEur: 33.18, price: 418118 },
  { code: 'GB086', name: 'Large coffee cup', collection: 'Garofano Blu', priceEur: 35.34, price: 445334 },
  { code: 'GB087', name: 'Large smooth cup with handle', collection: 'Garofano Blu', priceEur: 33.90, price: 427190 },
  { code: 'GB088', name: 'Large regular cup without handle', collection: 'Garofano Blu', priceEur: 33.18, price: 418118 },
  { code: 'GB089', name: 'English tea cup', collection: 'Garofano Blu', priceEur: 31.02, price: 390802 },
  { code: 'GB090', name: 'Small soup bowl', collection: 'Garofano Blu', priceEur: 56.98, price: 718000 },
  { code: 'GB091', name: 'Large soup bowl', collection: 'Garofano Blu', priceEur: 67.08, price: 845208 },
  { code: 'GB092', name: 'Teapot x 6 - 12 cm', collection: 'Garofano Blu', priceEur: 72.13, price: 908813 },
  { code: 'GB093', name: 'Teapot x 12 - 14 cm', collection: 'Garofano Blu', priceEur: 80.06, price: 1008806 },
  { code: 'GB094', name: 'Ground plate - 28 cm', collection: 'Garofano Blu', priceEur: 41.11, price: 518011 },
  { code: 'GB095', name: 'Ground plate - 32 cm', collection: 'Garofano Blu', priceEur: 50.49, price: 636149 },
  { code: 'GB096', name: 'Ground plate - 40 cm', collection: 'Garofano Blu', priceEur: 71.41, price: 899741 },
  { code: 'GB097', name: 'Small tray', collection: 'Garofano Blu', priceEur: 33.90, price: 427190 },
  { code: 'GB098', name: 'Large tray', collection: 'Garofano Blu', priceEur: 41.84, price: 527184 },
  { code: 'GB099', name: 'Rectangular tray with small handles', collection: 'Garofano Blu', priceEur: 23.80, price: 299880 },
  { code: 'GB107', name: 'Museum tray', collection: 'Garofano Blu', priceEur: 158.69, price: 1999469 },
  { code: 'GB101', name: 'Sugar bowl - 8 cm', collection: 'Garofano Blu', priceEur: 55.54, price: 699854 },
  { code: 'GB102', name: 'Sugar bowl - 9 cm', collection: 'Garofano Blu', priceEur: 59.87, price: 754387 },
  { code: 'GB103', name: 'Sugar bowl - 11 cm', collection: 'Garofano Blu', priceEur: 67.08, price: 845208 },
  { code: 'GB104', name: 'Soup serving bowl x 2', collection: 'Garofano Blu', priceEur: 158.69, price: 1999469 },
  { code: 'GB105', name: 'Soup serving bowl x 6', collection: 'Garofano Blu', priceEur: 196.20, price: 2472120 },
  { code: 'GB106', name: 'Soup serving bowl x 12', collection: 'Garofano Blu', priceEur: 224.33, price: 2826533 }
];

// Placeholder para colecciones sin imágenes específicas
const COMODIN_IMAGE = 'comodin-blu.jpg';

// ============================================================================
// FUNCIONES PÚBLICAS EXPORTADAS
// ============================================================================

/**
 * Renderiza el grid de productos en el DOM
 * @param {HTMLElement} gridElement - Elemento contenedor del grid
 */
export function renderCatalog(gridElement) {
  if (!gridElement) {
    console.error('Grid element not found');
    return;
  }
  
  gridElement.innerHTML = '';
  
  GAROFANO_BLU.forEach(product => {
    const card = createProductCard(product);
    gridElement.appendChild(card);
  });
  
  // Bind click events to "Add to Cart" buttons
  gridElement.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const code = e.currentTarget.dataset.code;
      const product = getProductByCode(code);
      if (product) {
        addToCart(product);
      }
    });
  });
}

/**
 * Crea una tarjeta de producto HTML
 * @param {Object} product - Objeto producto
 * @returns {HTMLElement} Elemento card
 */
function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.setAttribute('data-sku', product.code);
  
  // Imagen: ruta real + fallback si no existe
  const imageUrl = `${CONFIG.IMAGE_BASE_URL}${product.code}.jpg`;
  
  card.innerHTML = `
    <div class="product-image">
      <img 
        src="${imageUrl}" 
        alt="${product.name}" 
        loading="lazy"
        onerror="this.src='${CONFIG.IMAGE_BASE_URL}${COMODIN_IMAGE}'; this.alt='Producto ${product.code}';"
      >
    </div>
    <div class="product-info">
      <h3 class="product-name">${product.name}</h3>
      <p class="product-sku">SKU: ${product.code}</p>
      <p class="product-collection">${product.collection}</p>
      <p class="product-price">${formatPrice(product.price)}</p>
      <button class="btn-primary btn-add" data-code="${product.code}" type="button">
        Añadir al Carrito
      </button>
    </div>
  `;
  
  return card;
}

/**
 * Obtiene un producto por su código SKU
 * @param {string} code - Código del producto (ej: 'GB110')
 * @returns {Object|undefined} Producto o undefined si no existe
 */
export function getProductByCode(code) {
  return GAROFANO_BLU.find(p => p.code === code);
}

/**
 * Obtiene todos los productos de la colección
 * @returns {Array} Array de productos
 */
export function getAllProducts() {
  return [...GAROFANO_BLU];
}

/**
 * Filtra productos por colección
 * @param {string} collectionName - Nombre de la colección
 * @returns {Array} Productos filtrados
 */
export function getProductsByCollection(collectionName) {
  return GAROFANO_BLU.filter(p => p.collection === collectionName);
}

/**
 * Busca productos por término de búsqueda
 * @param {string} searchTerm - Término a buscar
 * @returns {Array} Productos que coinciden
 */
export function searchProducts(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return getAllProducts();
  
  return GAROFANO_BLU.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.code.toLowerCase().includes(term) ||
    p.collection.toLowerCase().includes(term)
  );
}

/**
 * Obtiene el precio de un producto en COP
 * @param {string} code - Código del producto
 * @returns {number} Precio en COP o 0 si no existe
 */
export function getPriceInCOP(code) {
  const product = getProductByCode(code);
  return product ? product.price : 0;
}

/**
 * Verifica si un producto tiene imagen disponible
 * @param {string} code - Código del producto
 * @returns {boolean} True si tiene imagen real, false si usa comodín
 */
export function hasRealImage(code) {
  // En producción, podrías hacer una petición HEAD para verificar
  // Por ahora, asumimos que todos los Garofano Blu tienen imagen
  return GAROFANO_BLU.some(p => p.code === code);
}

/**
 * Obtiene información de la colección Garofano Blu
 * @returns {Object} Metadatos de la colección
 */
export function getCollectionInfo() {
  return {
    name: 'Garofano Blu',
    totalProducts: GAROFANO_BLU.length,
    priceRange: {
      min: Math.min(...GAROFANO_BLU.map(p => p.price)),
      max: Math.max(...GAROFANO_BLU.map(p => p.price))
    },
    imageBase: CONFIG.IMAGE_BASE_URL,
    placeholder: COMODIN_IMAGE
  };
}

// ============================================================================
// INICIALIZACIÓN (opcional, si se llama directamente)
// ============================================================================

// Auto-render si el elemento existe al cargar el módulo
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('products-grid');
  if (grid && grid.children.length === 0) {
    renderCatalog(grid);
  }
});