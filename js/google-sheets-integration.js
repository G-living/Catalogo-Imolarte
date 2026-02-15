/**
 * IMOLARTE - Integración Google Sheets
 * Módulo para enviar pedidos a Google Sheets
 * Versión: 1.1 - CORS Habilitado
 */

// ===== CONFIGURACIÓN =====
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx73OKs0UgdASae2supyVThCfkwNyW-aouF0K3HRjG3UbiO6NiNdrm6XHshl29GVbwf/exec';

// Porcentajes configurables
const PORCENTAJE_ANTICIPO = 60;
const DESCUENTO_PAGO_COMPLETO = 3; // 3%

// ===== GENERADOR DE ID TEMPORAL =====

/**
 * Genera un ID temporal de pedido en formato IMO-YYYYMMDD-HHmmss
 * Nota: El ID real se genera en Google Sheets, este es solo para fallback
 */
function generarIdPedidoTemporal() {
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const min = String(ahora.getMinutes()).padStart(2, '0');
    const seg = String(ahora.getSeconds()).padStart(2, '0');
    
    return `IMO-${año}${mes}${dia}-${hora}${min}${seg}`;
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Calcula el descuento por pago completo
 */
function calcularDescuento(total) {
    return Math.round(total * (DESCUENTO_PAGO_COMPLETO / 100));
}

/**
 * Calcula monto del anticipo (60%)
 */
function calcularAnticipo(total) {
    return Math.round(total * (PORCENTAJE_ANTICIPO / 100));
}

/**
 * Calcula total con descuento
 */
function calcularTotalConDescuento(total) {
    return total - calcularDescuento(total);
}

// ===== ENVIAR PEDIDO A GOOGLE SHEETS =====

/**
 * Envía el pedido a Google Sheets
 * @param {Object} datosPedido - Datos completos del pedido
 * @returns {Promise} - Respuesta del servidor con pedidoId
 */
async function enviarPedidoASheets(datosPedido) {
    try {
        console.log('📊 Enviando pedido a Google Sheets...');
        console.log('Datos:', datosPedido);
        
        // Preparar FormData (evita preflight CORS)
        const formData = new FormData();
        
        // Cliente
        formData.append('tipoDocumento', datosPedido.cliente.tipoDocumento);
        formData.append('numeroDocumento', datosPedido.cliente.numeroDocumento);
        formData.append('nombre', datosPedido.cliente.nombre);
        formData.append('apellido', datosPedido.cliente.apellido);
        formData.append('email', datosPedido.cliente.email);
        formData.append('codigoPais', datosPedido.cliente.codigoPais);
        formData.append('telefono', datosPedido.cliente.telefono);
        formData.append('cumpleDia', datosPedido.cliente.cumpleDia);
        formData.append('cumpleMes', datosPedido.cliente.cumpleMes);
        formData.append('direccion', datosPedido.cliente.direccion || '');
        formData.append('barrio', datosPedido.cliente.barrio || '');
        formData.append('ciudad', datosPedido.cliente.ciudad || '');
        formData.append('notasDireccion', datosPedido.cliente.notasDireccion || '');
        
        // Items (como JSON string)
        formData.append('items', JSON.stringify(datosPedido.items));
        
        // Totales
        formData.append('subtotal', datosPedido.subtotal);
        formData.append('descuentoPorcentaje', datosPedido.descuentoPorcentaje);
        formData.append('descuentoMonto', datosPedido.descuentoMonto);
        formData.append('totalFinal', datosPedido.totalFinal);
        
        // Entrega
        formData.append('metodoEntrega', datosPedido.metodoEntrega);
        formData.append('notasEntrega', datosPedido.notasEntrega || '');
        
        // Pago
        formData.append('tipoPago', datosPedido.tipoPago);
        formData.append('notasInternas', datosPedido.notasInternas || '');
        
        // Enviar con FormData (NO incluir Content-Type, fetch lo infiere)
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            body: formData
        });
        
        // Ahora SÍ podemos leer la respuesta
        const resultado = await response.json();
        
        console.log('✅ Respuesta de Google Sheets:', resultado);
        
        if (resultado.success) {
            return {
                success: true,
                pedidoId: resultado.pedidoId,
                clienteId: resultado.clienteId,
                mensaje: resultado.mensaje || 'Pedido registrado en sistema'
            };
        } else {
            throw new Error(resultado.error || 'Error al registrar pedido');
        }
        
    } catch (error) {
        console.error('❌ Error al enviar a Google Sheets:', error);
        
        return {
            success: false,
            error: error.message,
            mensaje: 'Error al registrar pedido'
        };
    }
}

/**
 * Recopila todos los datos del formulario y carrito
 * @param {string} tipoPago - 'ANTICIPO_60' o 'PAGO_100'
 * @returns {Object} - Objeto con todos los datos estructurados
 */
function recopilarDatosPedido(tipoPago = 'ANTICIPO_60') {
    // Obtener datos del formulario
    const tipoDoc = document.getElementById('docType').value;
    const numDoc = document.getElementById('docNumber').value;
    const nombre = document.getElementById('firstName').value;
    const apellido = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const codigoPais = document.getElementById('countryCode').value;
    const telefono = document.getElementById('phone').value;
    const cumpleDia = document.getElementById('birthdayDay').value;
    const cumpleMes = document.getElementById('birthdayMonth').value;
    
    // Método de entrega
    const metodoEntrega = document.querySelector('input[name="delivery"]:checked').value;
    const esDomicilio = metodoEntrega === 'home';
    
    // Dirección (solo si es domicilio)
    const direccion = esDomicilio ? document.getElementById('address').value : '';
    const barrio = esDomicilio ? document.getElementById('neighborhood').value : '';
    const ciudad = esDomicilio ? document.getElementById('city').value : '';
    const notasEntrega = esDomicilio ? document.getElementById('notes').value : '';
    
    // Calcular totales
    const subtotal = getCartTotal();
    let descuentoPorcentaje = 0;
    let descuentoMonto = 0;
    let totalFinal = subtotal;
    
    // Si es pago completo, aplicar descuento del 3%
    if (tipoPago === 'PAGO_100') {
        descuentoPorcentaje = DESCUENTO_PAGO_COMPLETO;
        descuentoMonto = calcularDescuento(subtotal);
        totalFinal = calcularTotalConDescuento(subtotal);
    }
    
    // Preparar items del carrito
    const items = cart.map(item => ({
        producto: item.description,
        coleccion: item.collection,
        codigo: item.code,
        cantidad: item.quantity,
        precio: item.price,
        subtotal: item.price * item.quantity
    }));
    
    // Estructura completa del pedido
    const pedido = {
        cliente: {
            tipoDocumento: tipoDoc,
            numeroDocumento: numDoc,
            nombre: nombre,
            apellido: apellido,
            email: email,
            codigoPais: codigoPais,
            telefono: telefono,
            cumpleDia: parseInt(cumpleDia),
            cumpleMes: cumpleMes,
            direccion: direccion,
            barrio: barrio,
            ciudad: ciudad,
            notasDireccion: notasEntrega,
            totalCompra: totalFinal
        },
        items: items,
        subtotal: subtotal,
        descuentoPorcentaje: descuentoPorcentaje,
        descuentoMonto: descuentoMonto,
        totalFinal: totalFinal,
        metodoEntrega: esDomicilio ? 'DOMICILIO' : 'RETIRO',
        direccion: direccion,
        barrio: barrio,
        ciudad: ciudad,
        notasEntrega: notasEntrega,
        tipoPago: tipoPago,
        notasInternas: `Opción de pago: ${tipoPago === 'PAGO_100' ? 'Pago completo con descuento 3%' : 'Anticipo 60%'}`
    };
    
    return pedido;
}

// ===== MODIFICAR FUNCIONES EXISTENTES =====

/**
 * Modifica la función sendToWhatsApp original para incluir Google Sheets
 */
async function sendToWhatsAppConSheets(tipoPago = 'ANTICIPO_60') {
    // Validar formulario primero
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }
    
    // Recopilar datos
    const datosPedido = recopilarDatosPedido(tipoPago);
    
    // Mostrar loading
    mostrarLoading('Registrando pedido...');
    
    try {
        // Enviar a Google Sheets
        const resultado = await enviarPedidoASheets(datosPedido);
        
        if (resultado.success && resultado.pedidoId) {
            console.log('✅ Pedido registrado en Google Sheets');
            console.log('🆔 ID Pedido:', resultado.pedidoId);
            
            // Enviar a WhatsApp con el ID REAL de Google Sheets
            enviarWhatsAppOriginal(datosPedido, resultado.pedidoId);
            
            // Mostrar confirmación con ID
            mostrarNotificacion(`✅ Pedido ${resultado.pedidoId} registrado`);
            
            // Limpiar carrito
            setTimeout(() => {
                cart = [];
                updateCartUI();
                closeCheckoutModal();
            }, 1500);
        } else {
            // Fallback: usar ID temporal
            console.warn('⚠️ No se obtuvo ID de Sheets, usando temporal');
            const idTemporal = generarIdPedidoTemporal();
            enviarWhatsAppOriginal(datosPedido, idTemporal);
            mostrarNotificacion('⚠️ Pedido enviado (verificar registro)');
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        // En caso de error, usar ID temporal y enviar por WhatsApp
        const idTemporal = generarIdPedidoTemporal();
        enviarWhatsAppOriginal(datosPedido, idTemporal);
        mostrarNotificacion('⚠️ Pedido enviado por WhatsApp');
    } finally {
        ocultarLoading();
    }
}

/**
 * Envía mensaje de WhatsApp (función original)
 * @param {Object} datosPedido - Datos del pedido
 * @param {string} pedidoId - ID del pedido (generado por Sheets o temporal)
 */
function enviarWhatsAppOriginal(datosPedido, pedidoId) {
    const { cliente, items, subtotal, descuentoMonto, totalFinal, metodoEntrega, tipoPago } = datosPedido;
    
    let mensaje = '🛒 *NUEVO PEDIDO - IMOLARTE*\n\n';
    mensaje += `🆔 *ID Pedido:* ${pedidoId}\n`;
    mensaje += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n\n`;
    mensaje += '👤 *DATOS DEL CLIENTE*\n';
    mensaje += `📝 ${cliente.tipoDocumento}: ${cliente.numeroDocumento}\n`;
    mensaje += `Nombre: ${cliente.nombre} ${cliente.apellido}\n`;
    mensaje += `📧 Email: ${cliente.email}\n`;
    mensaje += `📱 Teléfono: ${cliente.codigoPais}${cliente.telefono}\n`;
    mensaje += `🎂 Cumpleaños: ${cliente.cumpleDia} de ${cliente.cumpleMes}\n\n`;
    
    mensaje += '📦 *PRODUCTOS*\n';
    mensaje += '━━━━━━━━━━━━━━━━━━━\n';
    
    items.forEach((item, index) => {
        mensaje += `${index + 1}. ${item.producto}\n`;
        mensaje += `   ${item.coleccion} - ${item.codigo}\n`;
        mensaje += `   Cant: ${item.cantidad} × ${formatPrice(item.precio)}\n`;
        mensaje += `   💰 ${formatPrice(item.subtotal)}\n\n`;
    });
    
    mensaje += '━━━━━━━━━━━━━━━━━━━\n';
    mensaje += `💵 Subtotal: ${formatPrice(subtotal)}\n`;
    
    if (descuentoMonto > 0) {
        mensaje += `🎉 Descuento (${DESCUENTO_PAGO_COMPLETO}%): -${formatPrice(descuentoMonto)}\n`;
    }
    
    mensaje += `💰 *TOTAL: ${formatPrice(totalFinal)}*\n\n`;
    
    // Información de pago según tipo
    if (tipoPago === 'PAGO_100') {
        mensaje += `✨ *PAGO ANTICIPADO COMPLETO*\n`;
        mensaje += `Con descuento del ${DESCUENTO_PAGO_COMPLETO}%\n`;
        mensaje += `Monto a pagar: ${formatPrice(totalFinal)}\n\n`;
    } else if (tipoPago === 'ANTICIPO_60') {
        const anticipo = calcularAnticipo(totalFinal);
        const saldo = totalFinal - anticipo;
        mensaje += `📊 *ANTICIPO (60%)*: ${formatPrice(anticipo)}\n`;
        mensaje += `📊 Saldo pendiente (40%): ${formatPrice(saldo)}\n`;
        mensaje += `💡 Saldo a pagar al recibir el pedido\n\n`;
    } else if (tipoPago === 'WHATSAPP_ONLY') {
        mensaje += `💬 *SOLICITUD DE PEDIDO*\n`;
        mensaje += `Forma de pago: A coordinar\n`;
        mensaje += `📞 Por favor confirma disponibilidad y coordinaremos la forma de pago\n\n`;
    }
    
    mensaje += `🚚 *ENTREGA*\n`;
    mensaje += metodoEntrega === 'DOMICILIO' 
        ? `📍 Domicilio: ${cliente.direccion}, ${cliente.barrio}, ${cliente.ciudad}\n`
        : `🏪 Retiro en almacén\n`;
    
    if (cliente.notasDireccion) {
        mensaje += `📝 Notas: ${cliente.notasDireccion}\n`;
    }
    
    const encodedMessage = encodeURIComponent(mensaje);
    const whatsappURL = `https://wa.me/573004257367?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// ===== UI HELPERS =====

/**
 * Muestra indicador de carga
 */
function mostrarLoading(mensaje = 'Procesando...') {
    const loading = document.createElement('div');
    loading.id = 'loading-overlay';
    loading.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        ">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #c9a961;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                "></div>
                <p style="
                    font-family: 'Lato', sans-serif;
                    font-size: 1.1rem;
                    color: #2c3e50;
                    margin: 0;
                ">${mensaje}</p>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loading);
}

/**
 * Oculta indicador de carga
 */
function ocultarLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.remove();
    }
}

/**
 * Muestra notificación temporal
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = mensaje;
    notif.style.background = tipo === 'success' 
        ? 'linear-gradient(135deg, #27ae60, #229954)'
        : 'linear-gradient(135deg, #e74c3c, #c0392b)';
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ===== EXPORTAR PARA USO GLOBAL =====
window.enviarPedidoConSheets = sendToWhatsAppConSheets;
window.calcularAnticipo = calcularAnticipo;
window.calcularDescuento = calcularDescuento;
window.calcularTotalConDescuento = calcularTotalConDescuento;

console.log('✅ Módulo Google Sheets cargado');
