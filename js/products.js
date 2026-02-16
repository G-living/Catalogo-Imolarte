// products.js - Gestión y renderizado de productos
// COMPLETO - Sin simplificaciones

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
    // Si tiene código de reutilización, usarlo
    if (product.reuse_image_code) {
        return product.reuse_image_code;
    }
    
    // Obtener del primer variant
    if (product.variants && product.variants.length > 0) {
        const code = product.variants[0].code;
        // Extraer solo números y rellenar con ceros
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
    currentProduct = product;
    modalQuantities = {};
    
    // Inicializar cantidades en 0 para cada variante
    product.variants.forEach(variant => {
        modalQuantities[variant.code] = 0;
    });

    const imageCode = getProductImageCode(product);
    const imagePath = `images/products/${imageCode}.jpg`;

    const modalBody = document.getElementById('modalBody');
    
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
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    updateAddToCartButton();
}

/**
 * Cierra el modal de producto
 */
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
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
            addToCart(
                currentProduct.description,
                variant.collection,
                variant.code,
                variant.price,
                quantity
            );
            itemsAdded += quantity;
        }
    });

    if (itemsAdded > 0) {
        // Mostrar feedback visual
        showNotification(`✅ ${itemsAdded} ${itemsAdded === 1 ? 'producto agregado' : 'productos agregados'} al carrito`);
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
            closeProductModal();
        }, 500);
    }
}

/**
 * Muestra una notificación temporal
 */
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: linear-gradient(135deg, #27ae60, #229954);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Lato', sans-serif;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===== PÁGINA DEL CARRITO =====

/**
 * Abre la página del carrito
 */
// ===== EVENT LISTENERS =====

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Renderizar productos
    renderProducts();

    // Botón del carrito flotante
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.addEventListener('click', showCartPage);
    }

    // Botón cerrar modal de producto
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProductModal);
    }

    // Cerrar modal al hacer click fuera
    const productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === productModal) {
                closeProductModal();
            }
        });
    }

    // Botón cerrar carrito
    const closeCartBtn = document.getElementById('closeCart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', hideCartPage);
    }

    // Cerrar carrito con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const cartPage = document.getElementById('cartPage');
            if (cartPage && cartPage.classList.contains('active')) {
                hideCartPage();
            }
            const productModal = document.getElementById('productModal');
            if (productModal && productModal.classList.contains('active')) {
                closeProductModal();
            }
        }
    });

    console.log('✅ products.js inicializado');
});

// Agregar estilos de animación solo si no existen
if (!document.getElementById('products-animations')) {
    const productsStyle = document.createElement('style');
    productsStyle.id = 'products-animations';
    productsStyle.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
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
    document.head.appendChild(productsStyle);
}
