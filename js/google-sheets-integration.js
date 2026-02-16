/**
 * ================================================================
 * IMOLARTE - INTEGRACIÓN GOOGLE SHEETS
 * ================================================================
 * Este archivo se carga en el catálogo web (GitHub Pages)
 * Envía pedidos a Google Sheets usando URLSearchParams
 * Versión: 5.0 - CORREGIDO: WHATSAPP_ONLY marca 0%
 * ================================================================
 */

// ===== CONFIGURACIÓN =====

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbw_qPay6DfCh-xxeosxmD-tuEINf9UIPT_i_0sNg5b6GbD-zZc93ZsaxjrAoqkn_m1u/exec';

const PORCENTAJE_ANTICIPO = 60;
const DESCUENTO_PAGO_COMPLETO = 3;

// ===== ENVÍO A GOOGLE SHEETS =====

/**
 * Envía pedido a Google Sheets
 * Usa URLSearchParams (application/x-www-form-urlencoded)
 * NO genera preflight CORS
 */
async function enviarPedidoASheets(datosPedido) {
  try {
    console.log('📊 Enviando pedido a Google Sheets...');
    
    // Crear URLSearchParams
    const params = new URLSearchParams();
    
    // Cliente
    params.append('tipoDocumento', datosPedido.cliente.tipoDocumento);
    params.append('numeroDocumento', datosPedido.cliente.numeroDocumento);
    params.append('nombre', datosPedido.cliente.nombre);
    params.append('apellido', datosPedido.cliente.apellido);
    params.append('email', datosPedido.cliente.email);
    params.append('codigoPais', datosPedido.cliente.codigoPais);
    params.append('telefono', datosPedido.cliente.telefono);
    params.append('cumpleDia', datosPedido.cliente.cumpleDia);
    params.append('cumpleMes', datosPedido.cliente.cumpleMes);
    params.append('direccion', datosPedido.cliente.direccion || '');
    params.append('barrio', datosPedido.cliente.barrio || '');
    params.append('ciudad', datosPedido.cliente.ciudad || '');
    params.append('notasDireccion', datosPedido.cliente.notasDireccion || '');
    
    // Items (JSON string)
    params.append('items', JSON.stringify(datosPedido.items));
    
    // Totales
    params.append('subtotal', datosPedido.subtotal);
    params.append('descuentoPorcentaje', datosPedido.descuentoPorcentaje);
    params.append('descuentoMonto', datosPedido.descuentoMonto);
    params.append('totalFinal', datosPedido.totalFinal);
    
    // Entrega
    params.append('metodoEntrega', datosPedido.metodoEntrega);
    params.append('notasEntrega', datosPedido.notasEntrega || '');
    
    // Pago
    params.append('tipoPago', datosPedido.tipoPago);
    params.append('notasInternas', datosPedido.notasInternas || '');
    
    console.log('📄 Enviando con URLSearchParams...');
    
    // Fetch con URLSearchParams
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      redirect: 'follow',
      body: params
    });
    
    console.log('✅ Response status:', response.status);
    
    // Leer respuesta
    const texto = await response.text();
    console.log('📄 Respuesta:', texto.substring(0, 200));
    
    // Parsear JSON
    const resultado = JSON.parse(texto);
    console.log('✅ Pedido registrado:', resultado.pedidoId);
    
    if (resultado.success) {
      return {
        success: true,
        pedidoId: resultado.pedidoId,
        clienteId: resultado.clienteId,
        mensaje: resultado.mensaje
      };
    } else {
      throw new Error(resultado.error || 'Error desconocido');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    return {
      success: false,
      error: error.message,
      pedidoId: null
    };
  }
}

// ===== RECOPILACIÓN DE DATOS =====

/**
 * Recopila datos del formulario y carrito
 * CORREGIDO: WHATSAPP_ONLY marca 0% descuento
 */
function recopilarDatosPedido(tipoPago = 'WHATSAPP_ONLY') {
  // Formulario
  const tipoDoc = document.getElementById('docType').value;
  const numDoc = document.getElementById('docNumber').value;
  const nombre = document.getElementById('firstName').value;
  const apellido = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const codigoPais = document.getElementById('countryCode').value;
  const telefono = document.getElementById('phone').value;
  const cumpleDia = document.getElementById('birthdayDay').value;
  const cumpleMes = document.getElementById('birthdayMonth').value;
  
  // Entrega
  const metodoEntrega = document.querySelector('input[name="delivery"]:checked').value;
  const esDomicilio = metodoEntrega === 'home';
  
  const direccion = esDomicilio ? document.getElementById('address').value : '';
  const barrio = esDomicilio ? document.getElementById('neighborhood').value : '';
  const ciudad = esDomicilio ? document.getElementById('city').value : '';
  const notasEntrega = esDomicilio ? document.getElementById('notes').value : '';
  
  // Totales
  const subtotal = getCartTotal();
  let descuentoPorcentaje = 0;
  let descuentoMonto = 0;
  let totalFinal = subtotal;
  let notasInternas = '';
  
  // ✅ CORREGIDO: Manejo correcto de cada tipo de pago
  if (tipoPago === 'PAGO_100') {
    // Pago completo con 3% descuento
    descuentoPorcentaje = DESCUENTO_PAGO_COMPLETO;
    descuentoMonto = Math.round(subtotal * (DESCUENTO_PAGO_COMPLETO / 100));
    totalFinal = subtotal - descuentoMonto;
    notasInternas = 'Opción: Pago completo -3%';
  } else if (tipoPago === 'ANTICIPO_60') {
    // Anticipo 60% - SIN descuento en subtotal
    descuentoPorcentaje = 0;
    descuentoMonto = 0;
    totalFinal = subtotal;
    notasInternas = 'Opción: Anticipo 60%';
  } else if (tipoPago === 'WHATSAPP_ONLY') {
    // ✅ WhatsApp - SIN descuento, PENDIENTE de pago
    descuentoPorcentaje = 0;
    descuentoMonto = 0;
    totalFinal = subtotal;
    notasInternas = 'Pedido vía WhatsApp - Pago pendiente';
  }
  
  // Items
  const items = cart.map(item => ({
    producto: item.productName,
    coleccion: item.collection,
    codigo: item.code,
    cantidad: item.quantity,
    precio: item.price,
    subtotal: item.price * item.quantity
  }));
  
  return {
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
      notasDireccion: notasEntrega
    },
    items: items,
    subtotal: subtotal,
    descuentoPorcentaje: descuentoPorcentaje,
    descuentoMonto: descuentoMonto,
    totalFinal: totalFinal,
    metodoEntrega: esDomicilio ? 'DOMICILIO' : 'RETIRO',
    notasEntrega: notasEntrega,
    tipoPago: tipoPago,
    notasInternas: notasInternas
  };
}

// ===== PROCESO COMPLETO =====

/**
 * Proceso completo: validar, enviar a Sheets, abrir WhatsApp
 */
async function sendToWhatsAppConSheets(tipoPago = 'WHATSAPP_ONLY') {
  // Validar formulario
  const form = document.getElementById('checkoutForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  // Recopilar datos
  const datosPedido = recopilarDatosPedido(tipoPago);
  
  // Mostrar loading
  mostrarLoading('Registrando pedido...');
  
  try {
    // Enviar a Sheets
    const resultado = await enviarPedidoASheets(datosPedido);
    
    if (resultado.success && resultado.pedidoId) {
      // ID real obtenido
      console.log('🆔 ID real:', resultado.pedidoId);
      enviarWhatsApp(datosPedido, resultado.pedidoId);
      mostrarNotificacion(`✅ Pedido ${resultado.pedidoId} registrado`);
    } else {
      // Falló - usar ID temporal
      console.warn('⚠️ Sin ID, usando temporal');
      const idTemporal = generarIdTemporal();
      enviarWhatsApp(datosPedido, idTemporal);
      mostrarNotificacion('⚠️ Pedido enviado - verificar Sheets');
    }
    
    // Limpiar carrito y detener timer
    setTimeout(() => {
      if (typeof window.stopCartTimer === 'function') {
        window.stopCartTimer();
      }
      cart = [];
      updateCartUI();
      closeCheckoutModal();
    }, 1500);
    
  } catch (error) {
    console.error('Error:', error);
    const idTemporal = generarIdTemporal();
    enviarWhatsApp(datosPedido, idTemporal);
    mostrarNotificacion('⚠️ Error - pedido enviado por WhatsApp');
  } finally {
    ocultarLoading();
  }
}

// ===== WHATSAPP =====

/**
 * Genera mensaje y abre WhatsApp
 * ACTUALIZADO: Manejo correcto de WHATSAPP_ONLY
 */
function enviarWhatsApp(datosPedido, pedidoId) {
  const { cliente, items, subtotal, descuentoMonto, totalFinal, metodoEntrega, tipoPago } = datosPedido;
  
  let mensaje = '🛒 *NUEVO PEDIDO - IMOLARTE*\n\n';
  mensaje += `🆔 *ID Pedido:* ${pedidoId}\n`;
  mensaje += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n\n`;
  
  mensaje += '👤 *CLIENTE*\n';
  mensaje += `🆔 ${cliente.tipoDocumento}: ${cliente.numeroDocumento}\n`;
  mensaje += `Nombre: ${cliente.nombre} ${cliente.apellido}\n`;
  mensaje += `📧 ${cliente.email}\n`;
  mensaje += `📱 ${cliente.codigoPais}${cliente.telefono}\n`;
  mensaje += `🎂 ${cliente.cumpleDia} de ${cliente.cumpleMes}\n\n`;
  
  mensaje += '📦 *PRODUCTOS*\n';
  mensaje += '━━━━━━━━━━━━━━━━━━━\n';
  
  items.forEach((item, i) => {
    mensaje += `${i + 1}. ${item.producto}\n`;
    mensaje += `   ${item.coleccion} - ${item.codigo}\n`;
    mensaje += `   ${item.cantidad} × ${formatPrice(item.precio)}\n`;
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
    mensaje += `✨ *PAGO COMPLETO CON DESCUENTO*\n`;
    mensaje += `Con descuento del ${DESCUENTO_PAGO_COMPLETO}%\n`;
    mensaje += `A pagar: ${formatPrice(totalFinal)}\n\n`;
  } else if (tipoPago === 'ANTICIPO_60') {
    const anticipo = Math.round(totalFinal * 0.60);
    const saldo = totalFinal - anticipo;
    mensaje += `📊 *ANTICIPO (60%)*: ${formatPrice(anticipo)}\n`;
    mensaje += `Saldo (40%): ${formatPrice(saldo)}\n`;
    mensaje += `💡 Saldo al recibir\n\n`;
  } else if (tipoPago === 'WHATSAPP_ONLY') {
    // ✅ WhatsApp - Pago pendiente
    mensaje += `💬 *PEDIDO VÍA WHATSAPP*\n`;
    mensaje += `Estado: Pago pendiente\n`;
    mensaje += `Total a pagar: ${formatPrice(totalFinal)}\n\n`;
  }
  
  // Entrega
  mensaje += `🚚 *ENTREGA*\n`;
  if (metodoEntrega === 'DOMICILIO') {
    mensaje += `🏠 ${cliente.direccion}\n`;
    mensaje += `   ${cliente.barrio}, ${cliente.ciudad}\n`;
    if (cliente.notasDireccion) {
      mensaje += `📝 ${cliente.notasDireccion}\n`;
    }
  } else {
    mensaje += `🏪 Retiro en almacén\n`;
  }
  
  const url = `https://wa.me/573004257367?text=${encodeURIComponent(mensaje)}`;
  window.open(url, '_blank');
}

// ===== UTILIDADES =====

/**
 * ID temporal formato: IMO-YYYYMMDD-HHmmss
 */
function generarIdTemporal() {
  const now = new Date();
  const año = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  const hora = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const seg = String(now.getSeconds()).padStart(2, '0');
  
  return `IMO-${año}${mes}${dia}-${hora}${min}${seg}`;
}

/**
 * Loading overlay
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

function ocultarLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) loading.remove();
}

/**
 * Notificación temporal
 */
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notif = document.createElement('div');
  notif.textContent = mensaje;
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? '#27ae60' : '#e74c3c'};
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 100000;
    font-family: 'Lato', sans-serif;
  `;
  
  document.body.appendChild(notif);
  
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ===== EXPORTAR =====

window.enviarPedidoConSheets = sendToWhatsAppConSheets;

console.log('✅ Integración Google Sheets cargada v5.0 (WHATSAPP_ONLY corregido)');
