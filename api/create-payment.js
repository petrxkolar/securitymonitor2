export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, company } = req.body;

    const goid = process.env.GOPAY_GOID?.trim();
    const clientId = process.env.GOPAY_CLIENT_ID?.trim();
    const clientSecret = process.env.GOPAY_CLIENT_SECRET?.trim();
    const isProduction = process.env.GOPAY_IS_PRODUCTION?.trim() === 'true';

    if (!clientId || !clientSecret || !goid) {
      throw new Error('Chybí konfigurace GoPay proměnných prostředí na Vercelu.');
    }

    const baseUrl = isProduction 
      ? 'https://gate.gopay.cz/api' 
      : 'https://gw.sandbox.gopay.com/api';

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('scope', 'payment-all');

    // 1. Získání OAuth přístupového tokenu
    const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    const tokenText = await tokenResponse.text();
    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch (e) {
      throw new Error(`GoPay token nevrátil platný JSON (HTTP ${tokenResponse.status}): ${tokenText}`);
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(`Chyba při komunikaci s GoPay (token - HTTP ${tokenResponse.status}): ` + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;

    // 2. Založení platby
    const orderId = 'SM-' + Date.now();
    const origin = req.headers.origin || 'https://securitymonitor.cz';

    const nameParts = (name || 'Zákazník Zákazník').trim().split(' ');
    const firstName = nameParts[0] || 'Zákazník';
    const lastName = nameParts.slice(1).join(' ') || 'Zákazník';

    const paymentPayload = {
      target_goid: parseInt(goid, 10), // GoPay API v3 standardně vyžaduje target_goid jako integer
      payer: {
        default_payment_instrument: 'PAYMENT_CARD',
        contact: {
          email: email || 'zakaznik@securitymonitor.cz',
          first_name: firstName,
          last_name: lastName,
          ...(phone?.trim() ? { phone_number: phone.trim() } : {})
        }
      },
      amount: 50000,
      currency: 'CZK',
      order_number: orderId,
      order_description: 'Security Monitor - Základní analýza',
      items: [
        {
          name: 'Základní analýza (Security Monitor)',
          amount: 50000,
          count: 1,
          type: 'ITEM'
        }
      ],
      callback: {
        return_url: `${origin}/?payment=success&order=${orderId}`
      }
    };

    // Výpis do logů Vercelu, abyste viděli přesně odesílaná data
    console.log('--- GOPAY DEBUG ---');
    console.log('Environment:', isProduction ? 'PRODUCTION' : 'SANDBOX');
    console.log('Target URL:', `${baseUrl}/payments/payment`);
    console.log('Payload:', JSON.stringify(paymentPayload, null, 2));
    console.log('-------------------');

    const paymentResponse = await fetch(`${baseUrl}/payments/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentText = await paymentResponse.text();
    let paymentData;
    try {
      paymentData = JSON.parse(paymentText);
    } catch (e) {
      throw new Error(`GoPay platba nevrátila platný JSON (HTTP ${paymentResponse.status}): ${paymentText}`);
    }

    if (!paymentResponse.ok || !paymentData.gw_url) {
      throw new Error(`Chyba při zakládání platby v GoPay: ${JSON.stringify(paymentData)}`);
    }

    return res.status(200).json({ gw_url: paymentData.gw_url });

  } catch (error) {
    console.error('GoPay Server Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
