// products.js - Gestión y renderizado de productos
// VERSIÓN CORREGIDA - 18 FEB 2026

// ===== VARIABLES GLOBALES =====
let currentProduct = null;
let modalQuantities = {};

// ===== FUNCIONES DE RENDERIZADO =====

/**
 * Renderiza todos los productos en la grilla principal
 */
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) {
        console.error('Grid de productos no encontrado');
        return;
    }

    const productsHTML = CATALOG_DATA.products.map(product => {
        const imageCode = getProductImageCode(product);
        const imagePath = `images/products/${imageCode}.jpg`;
        
        return `
            <div class="product-card" data-product-id="${product.description}" onclick='openProductModal(${JSON.stringify(product).replace(/'/g, "&apos;")})'>
                <div class="product-image-container">
                    <img src="${imagePath}" 
                         alt="${product.description}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='images/products/000.jpg'">
                </div>
                <div class="product-header">
                    <h3 class="product-title">${product.description}</h3>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = productsHTML;
    console.log(`✅ ${CATALOG_DATA.products.length} productos renderizados`);
}

/**
 * Obtiene el código de imagen para un producto
 */
function getProductImageCode(product) {
    if (product.reuse_image_code) {
        return product.reuse_image_code;
    }
    
    if (product.variants && product.variants.length > 0) {
        const code = product.variants[0].code;
        const numericCode = code.replace(/[^0-9]/g, '');
        return numericCode.padStart(3, '0');
    }
    
    return '000';
}

/**
 * Obtiene la imagen del comodín para una colección
 */
function getComodinImage(collection) {
    const cleanName = collection.replace(/ /g, '_').replace(/\//g, '_');
    return `images/comodines/${cleanName}.png`;
}

// ===== MODAL DE PRODUCTO =====

/**
 * Abre el modal con los detalles del producto
 */
function openProductModal(product) {
    console.log('Abriendo modal para:', product.description);
    
    currentProduct = product;
    modalQuantities = {};
    
    product.variants.forEach(variant => {
        modalQuantities[variant.code] = 0;
    });

    const imageCode = getProductImageCode(product);
    const imagePath = `images/products/${imageCode}.jpg`;

    const modalBody = document.getElementById('modalBody');
    if (!modalBody) {
        console.error('modalBody no encontrado');
        return;
    }
    
    const variantsHTML = product.variants.map(variant => {
        const comodinImage = getComodinImage(variant.collection);
        
        return `
            <div class="modal-variant" data-variant-code="${variant.code}">
                <img src="${comodinImage}" 
                     alt="${variant.collection}" 
                     class="modal-comodin"
                     onerror="this.style.display='none'">
                <div class="modal-variant-info">
                    <div class="modal-collection">${variant.collection}</div>
                    <div class="modal-code">${variant.code}</div>
                </div>
                <div class="modal-price-qty">
                    <div class="modal-price">${formatPrice(variant.price)}</div>
                    <div class="modal-qty">
                        <button type="button" 
                                class="qty-btn" 
                                onclick="decrementQuantity('${variant.code}')"
                                aria-label="Disminuir cantidad">−</button>
                        <span class="qty-display" id="qty-${variant.code}">0</span>
                        <button type="button" 
                                class="qty-btn" 
                                onclick="incrementQuantity('${variant.code}')"
                                aria-label="Aumentar cantidad">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const modalContent = `
        <div class="modal-product">
            <div class="modal-image-container">
                <img src="${imagePath}" 
                     alt="${product.description}" 
                     class="modal-image"
                     onerror="this.src='images/products/000.jpg'">
            </div>
            <div class="modal-details">
                <h2 class="modal-title">${product.description}</h2>
                <div class="modal-variants">
                    ${variantsHTML}
                </div>
                <div class="modal-actions">
                    <button type="button" 
                            class="btn btn-primary btn-add-to-cart" 
                            onclick="addSelectedToCart()"
                            id="addToCartBtn">
                        <span>🛒</span> Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;

    modalBody.innerHTML = modalContent;
    
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    updateAddToCartButton();
}

/**
 * Cierra el modal de producto
 */
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    currentProduct = null;
    modalQuantities = {};
}

/**
 * Incrementa la cantidad de una variante
 */
function incrementQuantity(variantCode) {
    if (!modalQuantities[variantCode]) {
        modalQuantities[variantCode] = 0;
    }
    modalQuantities[variantCode]++;
    updateQuantityDisplay(variantCode);
    updateAddToCartButton();
}

/**
 * Decrementa la cantidad de una variante
 */
function decrementQuantity(variantCode) {
    if (!modalQuantities[variantCode]) {
        modalQuantities[variantCode] = 0;
    }
    if (modalQuantities[variantCode] > 0) {
        modalQuantities[variantCode]--;
        updateQuantityDisplay(variantCode);
        updateAddToCartButton();
    }
}

/**
 * Actualiza el display de cantidad para una variante
 */
function updateQuantityDisplay(variantCode) {
    const display = document.getElementById(`qty-${variantCode}`);
    if (display) {
        display.textContent = modalQuantities[variantCode] || 0;
    }
}

/**
 * Actualiza el estado del botón "Agregar al Carrito"
 */
function updateAddToCartButton() {
    const btn = document.getElementById('addToCartBtn');
    if (!btn) return;

    const totalItems = Object.values(modalQuantities).reduce((sum, qty) => sum + qty, 0);
    
    if (totalItems === 0) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.innerHTML = '<span>🛒</span> Agregar al Carrito';
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<span>🛒</span> Agregar ${totalItems} ${totalItems === 1 ? 'producto' : 'productos'} al Carrito`;
    }
}

/**
 * Agrega las variantes seleccionadas al carrito
 */
function addSelectedToCart() {
    if (!currentProduct) {
        console.error('No hay producto actual');
        return;
    }

    let itemsAdded = 0;

    currentProduct.variants.forEach(variant => {
        const quantity = modalQuantities[variant.code] || 0;
        if (quantity > 0) {
            if (typeof window.addToCart === 'function') {
                window.addToCart(
                    currentProduct.description,
                    variant.collection,
                    variant.code,
                    variant.price,
                    quantity
                );
            }
            itemsAdded += quantity;
        }
    });

    if (itemsAdded > 0) {
        if (typeof window.showToast === 'function') {
            window.showToast(`✅ ${itemsAdded} ${itemsAdded === 1 ? 'producto agregado' : 'productos agregados'} al carrito`, 'success');
        } else {
            alert(`✅ ${itemsAdded} producto(s) agregado(s)`);
        }
        
        setTimeout(() => {
            closeProductModal();
        }, 500);
    }
}

// ===== FORMATO DE PRECIOS =====
function formatPrice(price) {
    const num = Number(price);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('es-CO');
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando products.js...');
    
    if (typeof CATALOG_DATA !== 'undefined' && CATALOG_DATA.products) {
        renderProducts();
    } else {
        console.error('CATALOG_DATA no encontrado');
    }

    const cartButton = document.getElementById('cartButton');
    if (cartButton && typeof window.showCartPage === 'function') {
        cartButton.addEventListener('click', window.showCartPage);
    }

    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProductModal);
    }

    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProductModal();
        }
    });

    console.log('✅ products.js inicializado');
});

// ===== EXPORTAR FUNCIONES =====
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addSelectedToCart = addSelectedToCart;
window.formatPrice = formatPrice;

console.log('📦 products.js cargado - VERSIÓN CORREGIDA');