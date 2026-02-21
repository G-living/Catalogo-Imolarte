// js/catalog.js
// IMOLARTE - Catálogo desde CSV unificado
// Lee productos desde /listino/catalogo-imolarte.csv

import { CONFIG } from './config.js';
import { addToCart } from './cart.js';
import { formatPrice } from './ui.js';

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let productsCache = [];
let productsLoaded = false;

// ============================================================================
// CARGAR PRODUCTOS DESDE CSV
// ============================================================================

/**
 * Carga productos desde CSV
 * @returns {Promise<Array>} Lista de productos
 */
export async function loadProducts() {
  if (productsLoaded) {
    return productsCache;
  }
  
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/listino/catalogo-imolarte.csv`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    productsCache = parseCSV(csvText);
    productsLoaded = true;
    
    console.log(`✅ ${productsCache.length} productos cargados desde CSV`);
    return productsCache;
    
  } catch (error) {
    console.error('❌ Error cargando productos desde CSV:', error);
    // Fallback: productos vacíos o hardcoded de emergencia
    productsCache = [];
    return [];
  }
}

/**
 * Parsea texto CSV a array de objetos
 * @param {string} csvText - Contenido CSV
 * @returns {Array} Productos parseados
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const products = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (maneja comas dentro de comillas)
    const values = parseCSVLine(line);
    
    if (values.length < headers.length) continue;
    
    const product = {};
    headers.forEach((header, index) => {
      product[header] = values[index] ? values[index].replace(/^"|"$/g, '').replace(/""/g, '"') : '';
    });
    
    // Solo productos activos
    if (product.Activo === 'TRUE') {
      products.push({
        code: product.SKU,
        name: product.Nombre,
        collection: product.Coleccion,
        priceEur: parseFloat(product.Precio_EUR) || 0,
        price: parseInt(product.Precio_COP) || 0,
        image: product.Imagen_Real,
        comodin: product.Comodin,
        stock: parseInt(product.Stock) || 0
      });
    }
  }
  
  return products;
}

/**
 * Parsea una línea CSV manejando comillas
 * @param {string} line - Línea CSV
 * @returns {Array} Valores parseados
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// ============================================================================
// RENDERIZADO DEL GRID
// ============================================================================

/**
 * Renderiza el grid de productos en el DOM
 * @param {HTMLElement} gridElement - Elemento contenedor del grid
 */
export async function renderCatalog(gridElement) {
  if (!gridElement) {
    console.error('Grid element not found');
    return;
  }
  
  // Mostrar loading
  gridElement.innerHTML = '<div class="loading">Cargando productos...</div>';
  
  // Cargar productos
  const products = await loadProducts();
  
  if (products.length === 0) {
    gridElement.innerHTML = '<div class="no-products">No hay productos disponibles</div>';
    return;
  }
  
  gridElement.innerHTML = '';
  
  products.forEach(product => {
    const card = createProductCard(product);
    gridElement.appendChild(card);
  });
  
  // Bind click events
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
  
  // Imagen: ruta real + fallback comodín por colección
  const imageUrl = `${CONFIG.IMAGE_BASE_URL}${product.image}`;
  const comodinUrl = `${CONFIG.COMODINES_BASE_URL}${product.comodin}`;
  
  card.innerHTML = `
    <div class="product-image">
      <img 
        src="${imageUrl}" 
        alt="${product.name}" 
        loading="lazy"
        onerror="this.src='${comodinUrl}'; this.alt='Producto ${product.code}';"
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

// ============================================================================
// FUNCIONES DE BÚSQUEDA Y FILTRO
// ============================================================================

/**
 * Obtiene un producto por su código SKU
 * @param {string} code - Código del producto
 * @returns {Object|undefined} Producto o undefined
 */
export function getProductByCode(code) {
  return productsCache.find(p => p.code === code);
}

/**
 * Obtiene todos los productos cargados
 * @returns {Array} Array de productos
 */
export function getAllProducts() {
  return [...productsCache];
}

/**
 * Filtra productos por colección
 * @param {string} collectionName - Nombre de la colección
 * @returns {Array} Productos filtrados
 */
export function getProductsByCollection(collectionName) {
  return productsCache.filter(p => p.collection === collectionName);
}

/**
 * Busca productos por término
 * @param {string} searchTerm - Término a buscar
 * @returns {Array} Productos que coinciden
 */
export function searchProducts(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return getAllProducts();
  
  return productsCache.filter(p => 
    p.name.toLowerCase().includes(term) || 
    p.code.toLowerCase().includes(term) ||
    p.collection.toLowerCase().includes(term)
  );
}

/**
 * Filtra productos por rango de precio
 * @param {number} min - Precio mínimo
 * @param {number} max - Precio máximo
 * @returns {Array} Productos filtrados
 */
export function filterByPrice(min, max) {
  return productsCache.filter(p => p.price >= min && p.price <= max);
}

/**
 * Obtiene colecciones disponibles
 * @returns {Array} Nombres de colecciones únicas
 */
export function getCollections() {
  const collections = new Set(productsCache.map(p => p.collection));
  return Array.from(collections);
}

/**
 * Verifica stock disponible
 * @param {string} code - Código del producto
 * @returns {boolean} True si hay stock
 */
export function isInStock(code) {
  const product = getProductByCode(code);
  return product ? product.stock > 0 : false;
}

/**
 * Obtiene información del catálogo
 * @returns {Object} Metadatos del catálogo
 */
export function getCatalogInfo() {
  const prices = productsCache.map(p => p.price);
  return {
    totalProducts: productsCache.length,
    collections: getCollections(),
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    lastLoaded: productsLoaded ? new Date().toISOString() : null
  };
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// Pre-cargar productos al cargar el módulo
loadProducts();

// Auto-render si el elemento existe
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('products-grid');
  if (grid && grid.children.length === 0) {
    renderCatalog(grid);
  }
});