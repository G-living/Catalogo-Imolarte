// checkout.js - Gestión del checkout, validaciones, Wompi y WhatsApp
// COMPLETO - Con toast en lugar de alerts

// ===== CONSTANTES =====
const WOMPI_PUBLIC_KEY = 'pub_test_rT7K8rzYnk2Ec8Lv25tRL3JIof6b6Lwp';
const WHATSAPP_NUMBER = '573004257367';

// ===== VARIABLES GLOBALES =====
let checkoutData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    delivery: 'pickup',
    address: '',
    neighborhood: '',
    city: 'Bogotá',
    notes: ''
};

// ===== FUNCIONES PRINCIPALES =====

/**
 * Abre el modal de checkout
 * @param {string} tipo - 'whatsapp' o 'wompi' para ocultar opciones
 */
function openCheckoutModal(tipo = null) {
    if (cart.length === 0) {
        showToast('Tu carrito está vacío', 'warning');
        return;
    }

    // Actualizar resumen
    updateCheckoutSummary();

    // Mostrar modal
    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Inicializar Google Places
    setTimeout(() => {
        if (typeof initGooglePlaces === 'function') {
            initGooglePlaces();
        }
    }, 100);
    
    // Manejar opciones de pago
    setTimeout(() => {
        if (tipo === 'whatsapp') {
            ocultarOpcionesWompi();
        } else if (tipo === 'wompi') {
            ocultarOpcionWhatsApp();
        } else {
            mostrarTodasLasOpciones();
        }
    }, 400);

    console.log('✅ Modal de checkout abierto - tipo:', tipo);
}

/**
 * Cierra el modal de checkout
 */
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    resetCheckoutForm();
}

/**
 * Actualiza el resumen del checkout
 */
function updateCheckoutSummary() {
    const subtotal = getCartTotal();
    
    document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
    document.getElementById('summaryTotal').textContent = formatPrice(subtotal);
    
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked');
    if (deliveryMethod && deliveryMethod.value === 'home') {
        document.getElementById('summaryShipping').textContent = 'A calcular';
    } else {
        document.getElementById('summaryShipping').textContent = '$0';
    }
}

/**
 * Resetea el formulario de checkout
 */
function resetCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.reset();
    }
    
    checkoutData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        delivery: 'pickup',
        address: '',
        neighborhood: '',
        city: 'Bogotá',
        notes: ''
    };

    const addressFields = document.getElementById('addressFields');
    if (addressFields) {
        addressFields.classList.remove('active');
    }

    document.querySelectorAll('.form-input.error').forEach(input => {
        input.classList.remove('error');
    });
}

// ===== VALIDACIONES =====

/**
 * Valida el formulario completo
 */
function validateCheckoutForm() {
    let isValid = true;
    const errors = [];

    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error');
    });

    const firstName = document.getElementById('firstName');
    if (!firstName.value.trim() || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(firstName.value)) {
        firstName.classList.add('error');
        errors.push('Nombre inválido');
        isValid = false;
    }

    const lastName = document.getElementById('lastName');
    if (!lastName.value.trim() || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(lastName.value)) {
        lastName.classList.add('error');
        errors.push('Apellido inválido');
        isValid = false;
    }

    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        email.classList.add('error');
        errors.push('Email inválido');
        isValid = false;
    }

    const phone = document.getElementById('phone');
    if (!/^[0-9]{10}$/.test(phone.value)) {
        phone.classList.add('error');
        errors.push('Teléfono debe tener 10 dígitos');
        isValid = false;
    }

    const deliveryMethod = document.querySelector('input[name="delivery"]:checked');
    if (!deliveryMethod) {
        errors.push('Selecciona un método de entrega');
        isValid = false;
    }

    if (deliveryMethod && deliveryMethod.value === 'home') {
        const address = document.getElementById('address');
        const neighborhood = document.getElementById('neighborhood');
        const city = document.getElementById('city');

        if (!address.value.trim()) {
            address.classList.add('error');
            errors.push('Dirección requerida');
            isValid = false;
        }

        if (!neighborhood.value.trim()) {
            neighborhood.classList.add('error');
            errors.push('Barrio requerido');
            isValid = false;
        }

        if (!city.value.trim()) {
            city.classList.add('error');
            errors.push('Ciudad requerida');
            isValid = false;
        }
    }

    const termsAccept = document.getElementById('termsAccept');
    if (!termsAccept.checked) {
        errors.push('Debes aceptar los Términos y Condiciones');
        isValid = false;
    }

    const cesionAccept = document.getElementById('cesionAccept');
    if (!cesionAccept.checked) {
        errors.push('Debes autorizar el tratamiento de datos');
        isValid = false;
    }

    if (!isValid) {
        showToast('Por favor completa todos los campos correctamente:\n' + errors.join('\n'), 'error');
    }

    return isValid;
}

/**
 * Recopila los datos del formulario
 */
function collectFormData() {
    const countryCode = document.getElementById('countryCode').value;
    const phone = document.getElementById('phone').value;
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked').value;

    return {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: countryCode + phone,
        delivery: deliveryMethod,
        address: document.getElementById('address').value.trim(),
        neighborhood: document.getElementById('neighborhood').value.trim(),
        city: document.getElementById('city').value.trim(),
        notes: document.getElementById('notes').value.trim()
    };
}

// ===== WHATSAPP =====

/**
 * Envía el pedido por WhatsApp
 */
function sendToWhatsApp() {
    if (!validateCheckoutForm()) {
        return;
    }

    const formData = collectFormData();
    const subtotal = getCartTotal();

    let message = '🛒 *PEDIDO IMOLARTE*\n';
    message += '━━━━━━━━━━━━━━━━━━━\n\n';

    message += '👤 *CLIENTE*\n';
    message += `${formData.firstName} ${formData.lastName}\n`;
    message += `📧 ${formData.email}\n`;
    message += `📱 ${formData.phone}\n\n`;

    if (formData.delivery === 'home') {
        message += '🚚 *ENTREGA A DOMICILIO*\n';
        message += `📍 ${formData.address}\n`;
        message += `🏘️ ${formData.neighborhood}, ${formData.city}\n`;
        if (formData.notes) {
            message += `📝 ${formData.notes}\n`;
        }
    } else {
        message += '🏪 *RETIRO EN ALMACÉN*\n';
    }
    message += '\n━━━━━━━━━━━━━━━━━━━\n\n';

    message += '📦 *PRODUCTOS*\n\n';
    cart.forEach((item, index) => {
        message += `${index + 1}. *${item.productName}*\n`;
        message += `   ${item.collection} - ${item.code}\n`;
        message += `   Cant: ${item.quantity} × ${formatPrice(item.price)}\n`;
        message += `   💰 ${formatPrice(item.price * item.quantity)}\n\n`;
    });

    message += '━━━━━━━━━━━━━━━━━━━\n';
    message += `💵 *TOTAL: ${formatPrice(subtotal)}*\n\n`;
    message += '✅ Términos aceptados\n';
    message += '👋 ¡Gracias por tu pedido!';

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');

    setTimeout(() => {
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckoutModal();
        closeCartPage();
        showToast('¡Pedido enviado! Te contactaremos por WhatsApp.', 'success');
    }, 1000);
}

// ===== FUNCIONES PARA MOSTRAR/OCULTAR OPCIONES =====

function ocultarOpcionesWompi() {
    const opcionesWompi = document.querySelectorAll('.payment-option:not(.payment-whatsapp)');
    const divider = document.querySelector('.payment-divider');
    
    opcionesWompi.forEach(opcion => {
        opcion.style.visibility = 'hidden';
        opcion.style.height = '0';
        opcion.style.overflow = 'hidden';
        opcion.style.margin = '0';
        opcion.style.padding = '0';
    });
    
    if (divider) {
        divider.style.display = 'none';
    }
}

function ocultarOpcionWhatsApp() {
    const opcionWhatsApp = document.querySelector('.payment-whatsapp');
    const divider = document.querySelector('.payment-divider');
    
    if (opcionWhatsApp) {
        opcionWhatsApp.style.visibility = 'hidden';
        opcionWhatsApp.style.height = '0';
        opcionWhatsApp.style.overflow = 'hidden';
        opcionWhatsApp.style.margin = '0';
        opcionWhatsApp.style.padding = '0';
    }
    
    if (divider) {
        divider.style.display = 'none';
    }
}

function mostrarTodasLasOpciones() {
    const todasLasOpciones = document.querySelectorAll('.payment-option');
    const divider = document.querySelector('.payment-divider');
    
    todasLasOpciones.forEach(opcion => {
        opcion.style.visibility = 'visible';
        opcion.style.height = '';
        opcion.style.overflow = '';
        opcion.style.margin = '';
        opcion.style.padding = '';
    });
    
    if (divider) {
        divider.style.display = 'flex';
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', function() {
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendToWhatsApp();
        });
    }

    const deliveryOptions = document.querySelectorAll('.delivery-option');
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const deliveryType = this.dataset.delivery;
            const radio = this.querySelector('input[type="radio"]');
            
            if (radio) {
                radio.checked = true;
                
                deliveryOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                const addressFields = document.getElementById('addressFields');
                if (deliveryType === 'home') {
                    addressFields.classList.add('active');
                    addressFields.querySelectorAll('input, textarea').forEach(field => {
                        if (field.id !== 'notes') {
                            field.required = true;
                        }
                    });
                    document.getElementById('summaryShipping').textContent = 'A calcular';
                } else {
                    addressFields.classList.remove('active');
                    addressFields.querySelectorAll('input, textarea').forEach(field => {
                        field.required = false;
                    });
                    document.getElementById('summaryShipping').textContent = '$0';
                }
                
                updateCheckoutSummary();
            }
        });
    });

    const showTermsLink = document.getElementById('showTerms');
    if (showTermsLink) {
        showTermsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showTermsAndConditions();
        });
    }

    const showCesionLink = document.getElementById('showCesion');
    if (showCesionLink) {
        showCesionLink.addEventListener('click', function(e) {
            e.preventDefault();
            showCesionModal();
        });
    }

    initBirthdaySelectors();

    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const checkoutModal = document.getElementById('checkoutModal');
            if (checkoutModal && checkoutModal.classList.contains('active')) {
                closeCheckoutModal();
            }
        }
    });

    console.log('✅ checkout.js inicializado');
});

console.log('📦 checkout.js loaded v2.0 (with toast)');