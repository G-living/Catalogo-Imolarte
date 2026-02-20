/**
 * IMOLARTE-sistema — Backend v3.4 (wishlist logging + employee follow-up columns)
 * Bound Google Apps Script
 */

const EMAIL_NOTIFICACIONES = 'filippo.massara2016@gmail.com';
const SPREADSHEET_ID = ''; // Leave empty for bound script

function getSS() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
    if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
    throw new Error('No spreadsheet found');
  } catch (err) {
    Logger.log('getSS error: ' + err);
    throw err;
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'createOrder';
    const ss = getSS();

    if (action === 'createOrder') {
      const sheet = ss.getSheetByName('PEDIDOS');
      if (!sheet) throw new Error('Hoja PEDIDOS no encontrada');

      const lastRow = sheet.getLastRow();
      const existingIds = lastRow > 1 
        ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().filter(id => id !== '')
        : [];

      if (existingIds.includes(data.ID_Pedido)) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: true, message: 'Orden duplicada prevenida' })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      sheet.appendRow([
        data.ID_Pedido,
        data.Origen || 'WEB',
        data.Fecha_Creacion,
        data.Hora_Creacion,
        data.Cliente_ID,
        data.Nombre_Cliente,
        data.Apellido_Cliente,
        data.Email_Cliente,
        data.Codigo_Pais || 'CO',
        data.Telefono_Cliente,
        data.Cumple_Dia || '',
        data.Cumple_Mes || '',
        data.Items_JSON,
        data.Subtotal,
        data.Descuento || 0,
        data.Total_Pedido,
        data.Metodo_Entrega || 'Retiro en Almacén',
        data.Direccion_Entrega || '',
        data.Barrio_Entrega || '',
        data.Ciudad_Entrega || '',
        data.Tipo_Pago || 'PAGO_100',
        data.Status_Pago || 'PENDIENTE',
        data.Notas_Pago || '',
        data.Referencia_Wompi || '',
        data.Link_Wompi || '',
        '', // Fecha_Pago
        '', // Monto_Pagado
        data.Notas_Internas || '',
        data.Referral_ID || '',
        data.Referral_Level || '',
        data.Referrer_ID || ''
      ]);

      updateClientTotals();
      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: 'Orden creada' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'createDono') {
      const sheet = ss.getSheetByName('DONOS');
      if (!sheet) throw new Error('Hoja DONOS no encontrada');

      sheet.appendRow([
        data.donoCode,
        data.purchaseDate,
        data.expirationDate,
        data.issuedAmount,
        data.issuerClientId,
        data.recipientName,
        data.recipientEmail || '',
        data.recipientPhone || '',
        data.status,
        data.usedAmount || 0,
        data.lastUsedDate || '',
        data.redeemedInOrderId || ''
      ]);

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: 'Dono creado' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'createWishlist') {
      const sheet = ss.getSheetByName('PEDIDOS');
      if (!sheet) throw new Error('Hoja PEDIDOS no encontrada');

      sheet.appendRow([
        data.ID_Wishlist,
        'WEB',
        new Date().toLocaleDateString('es-CO'),
        new Date().toLocaleTimeString('es-CO'),
        '', // Cliente_ID (optional for wishlist)
        data.Nombre,
        '', // Apellido
        data.Email,
        'CO',
        data.Telefono,
        '', '', // Cumple
        data.Items_JSON,
        data.Total_Estimado,
        0, // Descuento
        data.Total_Estimado,
        data.Entrega,
        data.Direccion || '',
        '', // Barrio
        '', // Ciudad
        'WISHLIST',
        'PENDIENTE',
        '', // Notas_Pago
        '', '', '', '', // Wompi fields
        '', // Notas_Internas
        '', '', '', // Referral
        data.Fecha_Contacto_Previsto,
        data.Empleado_Asignado || 'Filippo',
        data.Notas_Followup || '',
        data.Fecha_Ultimo_Contacto || '',
        data.Resultado_Contacto || ''
      ]);

      // Optional: email notification
      MailApp.sendEmail(EMAIL_NOTIFICACIONES, 'Nueva Wishlist Recibida', 
        'ID: ' + data.ID_Wishlist + '\nNombre: ' + data.Nombre + '\nTotal estimado: ' + data.Total_Estimado);

      return ContentService.createTextOutput(
        JSON.stringify({ success: true, message: 'Wishlist creada y notificada' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Acción desconocida' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateClientTotals() {
  // Same as before – total comprado in CLIENTES column Q
  const ss = getSS();
  const clientesSheet = ss.getSheetByName('CLIENTES');
  const pedidosSheet = ss.getSheetByName('PEDIDOS');

  const lastClientRow = clientesSheet.getLastRow();
  if (lastClientRow < 2) return;

  const clientIds = clientesSheet.getRange(2, 1, lastClientRow - 1, 1).getValues().flat();
  const pedidosData = pedidosSheet.getRange(2, 1, pedidosSheet.getLastRow() - 1, 16).getValues();

  clientIds.forEach((clientId, index) => {
    if (!clientId) return;
    let total = 0;

    pedidosData.forEach(row => {
      if (row[4] === clientId) { // Cliente_ID column E
        total += Number(row[15]) || 0; // Total_Pedido column P
      }
    });

    clientesSheet.getRange(index + 2, 17).setValue(total); // Column Q
  });
}

function dailyHealthCheck() {
  updateClientTotals();
  Logger.log('Daily health check completed at ' + new Date());
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'IMOLARTE Backend Active', timestamp: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}