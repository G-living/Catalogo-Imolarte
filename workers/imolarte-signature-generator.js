// signature-generator.js - Cloudflare Worker para generar firma Wompi
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { reference, amountInCents, currency = 'COP' } = body;

      if (!reference || !amountInCents || typeof amountInCents !== 'number' || amountInCents <= 0) {
        return new Response(JSON.stringify({ error: 'Missing or invalid reference/amountInCents' }), {
          status: 400,
          headers: corsHeaders
        });
      }

      const integrityKey = env.WOMPI_INTEGRITY_KEY;
      if (!integrityKey) {
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: corsHeaders });
      }

      const concat = `${reference}${amountInCents}${currency}${integrityKey}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(concat);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return new Response(
        JSON.stringify({ integritySignature: signature, reference, amountInCents, currency }),
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Signature generation failed' }), { status: 500, headers: corsHeaders });
    }
  }
};