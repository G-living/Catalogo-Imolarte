// checkout.js - Gestión del checkout, validaciones, Wompi y WhatsApp
// COMPLETO - Sin simplificaciones

// ===== CONSTANTES =====
const WOMPI_PUBLIC_KEY = 'pub_test_tXB8qjDFJayJhSoG8M0RGjdQj9O2GwuZ'; // Key de prueba
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
        alert('Tu carrito está vacío');
        return;
    }

    // Actualizar resumen
    updateCheckoutSummary();

    // Mostrar modal
    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Inicializar Google Places y manejar opciones después de un delay
    setTimeout(() => {
        if (typeof initGooglePlaces === 'function') {
            initGooglePlaces();
        }
    }, 100);
    
    // Manejar opciones de pago con delay mayor para asegurar que se ejecute después
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
    
    // El envío se calcula según el método seleccionado
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

    // Ocultar campos de dirección
    const addressFields = document.getElementById('addressFields');
    if (addressFields) {
        addressFields.classList.remove('active');
    }

    // Limpiar errores
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

    // Limpiar errores previos
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error');
    });

    // Validar nombre
    const firstName = document.getElementById('firstName');
    if (!firstName.value.trim() || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(firstName.value)) {
        firstName.classList.add('error');
        errors.push('Nombre inválido');
        isValid = false;
    }

    // Validar apellido
    const lastName = document.getElementById('lastName');
    if (!lastName.value.trim() || !/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(lastName.value)) {
        lastName.classList.add('error');
        errors.push('Apellido inválido');
        isValid = false;
    }

    // Validar email
    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        email.classList.add('error');
        errors.push('Email inválido');
        isValid = false;
    }

    // Validar teléfono
    const phone = document.getElementById('phone');
    if (!/^[0-9]{10}$/.test(phone.value)) {
        phone.classList.add('error');
        errors.push('Teléfono debe tener 10 dígitos');
        isValid = false;
    }

    // Validar método de entrega
    const deliveryMethod = document.querySelector('input[name="delivery"]:checked');
    const deliveryOptions = document.getElementById('deliveryOptionsContainer');
    const deliveryError = document.getElementById('deliveryError');
    
    if (!deliveryMethod) {
        errors.push('⚠️ Debes seleccionar un método de entrega');
        isValid = false;
        
        // Mostrar label de error
        if (deliveryError) {
            deliveryError.style.display = 'block';
        }
        
        // Resaltar visualmente la sección de entrega
        if (deliveryOptions) {
            deliveryOptions.style.border = '2px solid #e74c3c';
            deliveryOptions.style.borderRadius = '8px';
            deliveryOptions.style.padding = '0.5rem';
        }
        
        // Scroll a la sección de entrega
        if (deliveryOptions) {
            deliveryOptions.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else {
        // Limpiar error y resaltado si existe
        if (deliveryError) {
            deliveryError.style.display = 'none';
        }
        if (deliveryOptions) {
            deliveryOptions.style.border = '';
            deliveryOptions.style.padding = '';
        }
    }

    // Si es entrega a domicilio, validar dirección
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

    // Validar términos y condiciones
    const termsAccept = document.getElementById('termsAccept');
    if (!termsAccept.checked) {
        errors.push('Debes aceptar los Términos y Condiciones');
        isValid = false;
    }

    if (!isValid) {
        alert('Por favor completa todos los campos correctamente:\n\n' + errors.join('\n'));
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

    // Datos del cliente
    message += '👤 *CLIENTE*\n';
    message += `${formData.firstName} ${formData.lastName}\n`;
    message += `📧 ${formData.email}\n`;
    message += `📱 ${formData.phone}\n\n`;

    // Método de entrega
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

    // Productos
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

    // Codificar y abrir WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');

    // Limpiar carrito y cerrar después de enviar
    setTimeout(() => {
        cart = [];
        saveCart();
        updateCartBadge();
        closeCheckoutModal();
        closeCartPage();
        alert('¡Pedido enviado! Te contactaremos pronto por WhatsApp.');
    }, 1000);
}

// ===== WOMPI =====

/**
 * Procesa el pago con Wompi
 */
function processPayment() {
    if (!validateCheckoutForm()) {
        return;
    }

    const formData = collectFormData();
    const subtotal = getCartTotal();
    const amountInCents = Math.round(subtotal * 100);

    // Configurar checkout de Wompi
    const checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: amountInCents,
        reference: 'IMOLARTE-' + Date.now(),
        publicKey: WOMPI_PUBLIC_KEY,
        redirectUrl: window.location.href,
        taxInCents: {
            vat: 0,
            consumption: 0
        },
        customerData: {
            email: formData.email,
            fullName: `${formData.firstName} ${formData.lastName}`,
            phoneNumber: formData.phone,
            phoneNumberPrefix: formData.phone.substring(0, 3),
            legalId: '',
            legalIdType: 'CC'
        },
        shippingAddress: formData.delivery === 'home' ? {
            addressLine1: formData.address,
            city: formData.city,
            phoneNumber: formData.phone,
            region: formData.neighborhood,
            country: 'CO'
        } : undefined
    });

    // Abrir widget de Wompi
    checkout.open(function(result) {
        const transaction = result.transaction;

        if (transaction.status === 'APPROVED') {
            // Pago exitoso - enviar confirmación por WhatsApp
            sendPaymentConfirmationToWhatsApp(formData, transaction);

            // Limpiar carrito
            cart = [];
            saveCart();
            updateCartBadge();

            // Cerrar modales
            closeCheckoutModal();
            closeCartPage();

            // Mostrar mensaje de éxito
            alert('¡Pago exitoso! Tu pedido ha sido procesado. Recibirás una confirmación por WhatsApp.');
        } else if (transaction.status === 'DECLINED') {
            alert('El pago fue rechazado. Por favor intenta con otro método de pago.');
        } else if (transaction.status === 'ERROR') {
            alert('Hubo un error procesando el pago. Por favor intenta nuevamente.');
        } else {
            console.log('Estado de transacción:', transaction.status);
        }
    });
}

/**
 * Envía confirmación de pago por WhatsApp
 */
function sendPaymentConfirmationToWhatsApp(formData, transaction) {
    const subtotal = getCartTotal();

    let message = '✅ *PAGO CONFIRMADO - IMOLARTE*\n';
    message += '━━━━━━━━━━━━━━━━━━━\n\n';

    // Datos de la transacción
    message += '💳 *PAGO*\n';
    message += `ID: ${transaction.id}\n`;
    message += `Estado: ${transaction.status}\n`;
    message += `Método: ${transaction.payment_method_type || 'N/A'}\n\n`;

    // Datos del cliente
    message += '👤 *CLIENTE*\n';
    message += `${formData.firstName} ${formData.lastName}\n`;
    message += `📧 ${formData.email}\n`;
    message += `📱 ${formData.phone}\n\n`;

    // Entrega
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

    // Productos
    message += '📦 *PRODUCTOS*\n\n';
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.productName}\n`;
        message += `   ${item.collection} - ${item.code}\n`;
        message += `   Cant: ${item.quantity} × ${formatPrice(item.price)}\n`;
        message += `   💰 ${formatPrice(item.price * item.quantity)}\n\n`;
    });

    message += '━━━━━━━━━━━━━━━━━━━\n';
    message += `💵 *TOTAL PAGADO: ${formatPrice(subtotal)}*\n\n`;
    message += '🎉 ¡Pedido confirmado y pagado!';

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// ===== TÉRMINOS Y CONDICIONES =====

/**
 * Muestra los términos y condiciones en un popup modal
 */
function showTermsAndConditions() {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'terms-modal';
    modal.innerHTML = `
        <div class="terms-content">
            <button class="terms-close" onclick="closeTermsModal()">×</button>
            <div class="terms-body">
                <h1>Términos y Condiciones</h1>
                
                <h2>1. Aceptación de Términos</h2>
                <p>
                    Al realizar un pedido en IMOLARTE by Helena Caballero, el cliente acepta 
                    estos términos y condiciones en su totalidad. Si no está de acuerdo con 
                    alguna parte de estos términos, por favor no realice su pedido.
                </p>
                
                <h2>2. Productos</h2>
                <p>
                    Todos los productos ofrecidos son cerámicas artesanales importadas de Italia. 
                    Cada pieza es única y puede presentar pequeñas variaciones en color, textura 
                    y acabado respecto a las fotografías mostradas en el catálogo.
                </p>
                <p>
                    Los colores de los productos pueden variar ligeramente de las fotografías 
                    debido a las configuraciones de pantalla de cada dispositivo.
                </p>
                
                <h2>3. Precios</h2>
                <p>
                    Todos los precios están expresados en pesos colombianos (COP) e incluyen 
                    el IVA correspondiente. Los precios están sujetos a cambios sin previo aviso.
                </p>
                <p>
                    Los costos de envío a domicilio se calculan según la ubicación del cliente 
                    y se informan antes de confirmar la compra.
                </p>
                
                <h2>4. Entregas</h2>
                <p>
                    Ofrecemos dos modalidades de entrega:
                </p>
                <ul>
                    <li><strong>Retiro en almacén:</strong> Sin costo adicional. Disponible 
                    de lunes a sábado en horario acordado.</li>
                    <li><strong>Entrega a domicilio:</strong> Realizamos entregas a domicilio 
                    a todo el país.</li>
                </ul>
                <p>
                    <strong>Tiempos de producción e importación:</strong> Los productos tienen un 
                    proceso de fabricación en Italia de entre 100 y 120 días. Posteriormente, el 
                    proceso de importación toma alrededor de 30 días adicionales. Por lo tanto, el 
                    tiempo de entrega promedio es de aproximadamente 150 días calendario desde la 
                    confirmación del pedido y el cobro efectivo del anticipo del 60%. Haremos todo 
                    lo objetivamente posible para reducir estos tiempos cuando las condiciones lo 
                    permitan.
                </p>
                
                <h2>5. Forma de Pago</h2>
                <p>
                    Aceptamos las siguientes formas de pago:
                </p>
                <ul>
                    <li><strong>Pago anticipado del 60%:</strong> Como anticipo para confirmar el pedido</li>
                    <li><strong>Pago anticipado del 100%:</strong> Con descuento del 3% sobre el valor total</li>
                    <li><strong>Pago coordinado:</strong> Envía tu solicitud por WhatsApp y coordinamos 
                    la forma de pago que mejor se ajuste a tus necesidades</li>
                </ul>
                <p>
                    <strong>Costos de transporte:</strong> Los costos de transporte hasta el domicilio de 
                    entrega acordado se cobran por adelantado e incluyen seguro de la mercancía. Nos apoyamos 
                    en empresas especializadas en el manejo de objetos de valor. Una vez confirmado el pago 
                    efectivo del transporte, se informarán los tiempos estimados de entrega y la guía de 
                    seguimiento del envío.
                </p>
                
                <h2>6. Política de Devoluciones</h2>
                <p>
                    Aceptamos devoluciones dentro de los 15 días calendario posteriores a la 
                    recepción del producto, siempre y cuando:
                </p>
                <ul>
                    <li>El producto presente defectos de fabricación</li>
                    <li>El producto esté en su empaque original</li>
                    <li>No presente señales de uso</li>
                </ul>
                <p>
                    No se aceptan devoluciones por cambio de opinión una vez retirado o 
                    recibido el producto.
                </p>
                <p>
                    <strong>Las devoluciones se hacen y reciben únicamente de forma presencial 
                    en nuestro almacén.</strong>
                </p>
                
                <h2>7. Garantía</h2>
                <p>
                    Todos nuestros productos cuentan con <strong>garantía de 1 año</strong> contra 
                    defectos de fabricación. La garantía no cubre daños causados por:
                </p>
                <ul>
                    <li>Uso inadecuado del producto</li>
                    <li>Caídas o golpes</li>
                    <li>Exposición a temperaturas extremas no recomendadas</li>
                </ul>
                
                <h2>7. Cuidado de los Productos</h2>
                <p>
                    Las cerámicas artesanales requieren cuidados especiales:
                </p>
                <ul>
                    <li>Lavar a mano con agua tibia y jabón suave</li>
                    <li>Evitar cambios bruscos de temperatura</li>
                    <li>No usar en microondas a menos que se especifique lo contrario</li>
                    <li>Secar completamente después del lavado</li>
                </ul>
                
                <h2>8. Privacidad y Protección de Datos</h2>
                <p>
                    El tratamiento de datos personales se realizará conforme a la normatividad 
                    colombiana vigente: Ley Estatutaria 1581 de 2012, Decreto 1377 de 2013, 
                    Decreto 1074 de 2015 y las circulares de la Superintendencia de Industria 
                    y Comercio (SIC) correspondientes.
                </p>
                <p>
                    La información personal proporcionada durante el proceso de compra será 
                    utilizada únicamente para:
                </p>
                <ul>
                    <li>Procesar y entregar su pedido</li>
                    <li>Enviar confirmaciones y actualizaciones</li>
                    <li>Mejorar nuestro servicio</li>
                </ul>
                <p>
                    No compartimos información personal con terceros, excepto cuando sea 
                    necesario para completar la transacción (procesadores de pago, empresas 
                    de mensajería).
                </p>
                
                <h2>9. Veracidad de Datos</h2>
                <p>
                    El Cliente declara y garantiza que toda la información proporcionada durante 
                    el proceso de registro, compra o cualquier interacción con el sitio web o la 
                    plataforma es veraz, completa, exacta, actualizada y corresponde a su realidad. 
                    El CLIENTE asume plena responsabilidad por la veracidad, calidad y exactitud de 
                    los datos suministrados, incluyendo pero no limitado a datos personales, de 
                    contacto, de pago y de entrega. Helena Caballero SAS presume de buena fe la 
                    veracidad de dicha información y no está obligada a verificarla de manera 
                    independiente, sin perjuicio de las acciones que pueda tomar en caso de 
                    detección de inconsistencias o falsedad. Cualquier consecuencia derivada de 
                    la inexactitud, falsedad o incompletitud de los datos proporcionados por el 
                    Cliente será de su exclusiva responsabilidad, incluyendo la imposibilidad de 
                    entrega, devoluciones no procedentes, rechazos de pago o cualquier perjuicio 
                    económico o legal. El Cliente se compromete a actualizar inmediatamente sus 
                    datos en caso de cambios, y autoriza a Helena Caballero SAS a utilizarlos 
                    conforme a la Política de Tratamiento de Datos Personales publicada en el sitio.
                </p>
                
                <h2>10. Contacto</h2>
                <p>
                    Para consultas, reclamos o sugerencias, puede contactarnos a través de:
                </p>
                <ul>
                    <li>WhatsApp: +57 300 425 7367</li>
                    <li>Email: administracion@helenacaballero.com</li>
                </ul>
                
                <div class="terms-footer">
                    <p><strong>Última actualización:</strong> Febrero 2026</p>
                    <p><strong>IMOLARTE by Helena Caballero SAS</strong></p>
                    <p>Cerámicas Artesanales Importadas de Italia</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de términos y condiciones
 */
function closeTermsModal() {
    const modal = document.querySelector('.terms-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    }
}

// ===== CESIÓN DE CARTERA =====

/**
 * Muestra la autorización de cesión de cartera en un popup modal
 */
function showCesionModal() {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'cesion-modal';
    modal.innerHTML = `
        <div class="cesion-content">
            <button class="cesion-close" onclick="closeCesionModal()">×</button>
            <div class="cesion-body">
                <h1>Autorización de Cesión de Cartera</h1>
                
                <p>
                    El Cliente autoriza expresamente a Helena Caballero SAS a ceder, endosar, transferir 
                    o negociar la totalidad o parte de la obligación derivada de la presente compra 
                    (incluyendo el saldo pendiente, intereses, costos de cobranza y demás accesorios) 
                    a terceros (entidades de cobranza, abogados, fondos de inversión en cartera, empresas 
                    especializadas en recaudo o cualquier otro cesionario), en caso de mora, incumplimiento 
                    o cuando así lo considere necesario para la recuperación de la deuda.
                </p>
                
                <p>
                    Asimismo, autoriza expresamente el tratamiento, consulta, reporte y circulación de 
                    sus datos personales (incluyendo identificación, información financiera, hábitos de 
                    pago, monto adeudado y situación de mora) por parte de Helena Caballero SAS y de los 
                    terceros cesionarios o encargados de cobranza, exclusivamente para fines de gestión 
                    de cobro, reporte a centrales de riesgo (si aplica Ley 1266/2008) y ejecución de la 
                    obligación.
                </p>
                
                <p>
                    Esta autorización se otorga de manera libre, previa, expresa e informada, conforme 
                    a la Ley 1581 de 2012 y sus decretos reglamentarios, y podrá ser revocada por el 
                    Cliente mediante comunicación escrita a administracion@helenacaballero.com, sin 
                    perjuicio de las obligaciones ya vencidas ni de los efectos de la cesión ya realizada.
                </p>
                
                <p>
                    <strong>El CLIENTE declara conocer que la cesión no lo libera de la obligación de 
                    pago, la cual podrá ser exigida directamente por el cesionario.</strong>
                </p>
                
                <div class="cesion-footer">
                    <p><strong>Última actualización:</strong> Febrero 2026</p>
                    <p><strong>IMOLARTE by Helena Caballero SAS</strong></p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

/**
 * Cierra el modal de cesión de cartera
 */
function closeCesionModal() {
    const modal = document.querySelector('.cesion-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
    }
}

// ===== CUMPLEAÑOS =====

/**
 * Inicializa los selectores de día y mes de cumpleaños
 */
function initBirthdaySelectors() {
    const daySelect = document.getElementById('birthdayDay');
    const monthSelect = document.getElementById('birthdayMonth');
    
    if (!daySelect || !monthSelect) return;
    
    // Llenar días (1-31)
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }
    
    // Llenar meses
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', function() {
    // Botón cerrar checkout
    const closeCheckoutBtn = document.getElementById('closeCheckout');
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
    }

    // Formulario de checkout
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendToWhatsApp();
        });
    }

    // Botón de pago
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.addEventListener('click', processPayment);
    }

    // Opciones de entrega
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const deliveryType = this.dataset.delivery;
            const radio = this.querySelector('input[type="radio"]');
            
            if (radio) {
                radio.checked = true;
                
                // ✅ NUEVO: Ocultar error cuando se selecciona
                const deliveryError = document.getElementById('deliveryError');
                const deliveryContainer = document.getElementById('deliveryOptionsContainer');
                if (deliveryError) {
                    deliveryError.style.display = 'none';
                }
                if (deliveryContainer) {
                    deliveryContainer.style.border = '';
                    deliveryContainer.style.padding = '';
                }
                
                // Actualizar estilos
                deliveryOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                // Mostrar/ocultar campos de dirección
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

    // Link de términos y condiciones
    const showTermsLink = document.getElementById('showTerms');
    if (showTermsLink) {
        showTermsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showTermsAndConditions();
        });
    }

    // Link de cesión de cartera
    const showCesionLink = document.getElementById('showCesion');
    if (showCesionLink) {
        showCesionLink.addEventListener('click', function(e) {
            e.preventDefault();
            showCesionModal();
        });
    }

    // Inicializar selectores de cumpleaños
    initBirthdaySelectors();

    // Remover clase de error al escribir
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('error');
        });
    });

    // Cerrar checkout con ESC
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
// ===== INTEGRACIÓN GOOGLE SHEETS Y NUEVOS BOTONES =====
// AGREGAR AL FINAL DE checkout.js (antes del último console.log)

/**
 * Actualiza los montos mostrados en las opciones de pago
 */
function actualizarMontosPago() {
    const subtotal = getCartTotal();
    
    // Calcular anticipo (60%)
    const anticipo = Math.round(subtotal * 0.6);
    
    // Calcular descuento (3% del total)
    const descuento = Math.round(subtotal * 0.03);
    
    // Calcular total con descuento
    const totalConDescuento = subtotal - descuento;
    
    // Actualizar UI - Anticipo
    const anticipoElement = document.querySelector('#anticipoAmount .amount-value');
    if (anticipoElement) {
        anticipoElement.textContent = formatPrice(anticipo);
    }
    
    // Actualizar UI - Ahorro
    const savingsElement = document.querySelector('#savingsAmount .savings-value');
    if (savingsElement) {
        savingsElement.textContent = formatPrice(descuento);
    }
    
    // Actualizar UI - Total con descuento
    const completeElement = document.querySelector('#completeAmount .amount-value');
    if (completeElement) {
        completeElement.textContent = formatPrice(totalConDescuento);
    }
}

/**
 * Maneja el click en "Pagar Anticipo"
 */
async function handlePagarAnticipo() {
    const checkoutForm = document.getElementById('checkoutForm');
    
    // Validar formulario
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }
    
    // Verificar checkboxes
    if (!document.getElementById('termsAccept').checked) {
        alert('Debes aceptar los Términos y Condiciones');
        return;
    }
    
    if (!document.getElementById('cesionAccept').checked) {
        alert('Debes autorizar la Cesión de Cartera');
        return;
    }
    
    // Usar la función de integración con Sheets
    if (typeof window.enviarPedidoConSheets === 'function') {
        await window.enviarPedidoConSheets('ANTICIPO_60');
    } else {
        console.error('Módulo de Google Sheets no cargado');
        alert('Error: Módulo de integración no disponible');
    }
}

/**
 * Maneja el click en "Pagar 100% Ahora"
 */
async function handlePagarCompleto() {
    const checkoutForm = document.getElementById('checkoutForm');
    
    // Validar formulario
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }
    
    // Verificar checkboxes
    if (!document.getElementById('termsAccept').checked) {
        alert('Debes aceptar los Términos y Condiciones');
        return;
    }
    
    if (!document.getElementById('cesionAccept').checked) {
        alert('Debes autorizar la Cesión de Cartera');
        return;
    }
    
    // Usar la función de integración con Sheets
    if (typeof window.enviarPedidoConSheets === 'function') {
        await window.enviarPedidoConSheets('PAGO_100');
    } else {
        console.error('Módulo de Google Sheets no cargado');
        alert('Error: Módulo de integración no disponible');
    }
}

/**
 * Modifica la función sendToWhatsApp para usar integración con Sheets
 */
const sendToWhatsAppOriginal = sendToWhatsApp;

function sendToWhatsApp() {
    const checkoutForm = document.getElementById('checkoutForm');
    
    // Validar formulario
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }
    
    // Verificar checkboxes
    if (!document.getElementById('termsAccept').checked) {
        alert('Debes aceptar los Términos y Condiciones');
        return;
    }
    
    if (!document.getElementById('cesionAccept').checked) {
        alert('Debes autorizar la Cesión de Cartera');
        return;
    }
    
    // Usar la función de integración con Sheets
    if (typeof window.enviarPedidoConSheets === 'function') {
        window.enviarPedidoConSheets('WHATSAPP_ONLY');
    } else {
        // Fallback a la función original
        sendToWhatsAppOriginal();
    }
}

// ===== FUNCIONES PARA MOSTRAR/OCULTAR OPCIONES =====

/**
 * Oculta las opciones de pago Wompi
 */
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
    
    console.log('❌ Opciones Wompi ocultas');
}

/**
 * Oculta la opción de WhatsApp
 */
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
    
    console.log('❌ Opción WhatsApp oculta');
}

/**
 * Muestra todas las opciones de pago
 */
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
    
    console.log('✅ Todas las opciones visibles');
}

// ===== EVENT LISTENERS PARA NUEVOS BOTONES =====

document.addEventListener('DOMContentLoaded', function() {
    // Actualizar montos cuando se abre el checkout
    const originalOpenCheckoutModal = openCheckoutModal;
    window.openCheckoutModal = function(tipo) {
        originalOpenCheckoutModal(tipo);
        setTimeout(() => {
            actualizarMontosPago();
        }, 100);
    };
    
    // Botón Pagar Anticipo
    const btnAnticipo = document.getElementById('btnAnticipo');
    if (btnAnticipo) {
        btnAnticipo.addEventListener('click', handlePagarAnticipo);
    }
    
    // Botón Pagar Completo
    const btnPagoCompleto = document.getElementById('btnPagoCompleto');
    if (btnPagoCompleto) {
        btnPagoCompleto.addEventListener('click', handlePagarCompleto);
    }
    
    console.log('✅ Nuevos botones de pago configurados');
});
