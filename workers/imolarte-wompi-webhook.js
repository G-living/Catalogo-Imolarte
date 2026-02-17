// wompi-webhook.js - Cloudflare Worker para recibir confirmaciones Wompi
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const payload = await request.json();
      console.log('Webhook received:', JSON.stringify(payload));

      const transaction = payload.data?.transaction;
      if (!transaction || transaction.status !== 'APPROVED') {
        return new Response(JSON.stringify({ message: 'Ignored' }), { status: 200 });
      }

      const { id: transactionId, reference: pedidoId, amount_in_cents } = transaction;

      // Verificación de firma (seguridad crítica)
      const isValid = await verifySignature(request, payload, env.WOMPI_EVENTS_SECRET);
      if (!isValid) {
        return new Response('Invalid signature', { status: 401 });
      }

      // Actualizar Google Sheets
      const updateSuccess = await updateSheets(env, pedidoId, transactionId, amount_in_cents);
      if (updateSuccess) {
        return new Response(JSON.stringify({ success: true, orderId: pedidoId }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ error: 'Sheets update failed' }), { status: 500 });
      }
    } catch (err) {
      return new Response('Processing error', { status: 500 });
    }
  }
};

async function verifySignature(request, payload, secret) {
  if (!secret) return false;

  const checksum = request.headers.get('x-event-checksum');
  if (!checksum) return false;

  const props = payload.data?.transaction?.signature?.properties || [];
  if (!props.length) return false;

  let concat = '';
  for (const prop of props) {
    const value = prop.split('.').reduce((o, k) => o?.[k], payload.data) ?? '';
    concat += value;
  }
  concat += secret;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(concat));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  return computed === checksum.toLowerCase();
}

async function updateSheets(env, pedidoId, transactionId, amountInCents) {
  const url = env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updatePayment',
        data: { pedidoId, transactionId, amountPaid: amountInCents / 100, paymentStatus: 'APPROVED' }
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}