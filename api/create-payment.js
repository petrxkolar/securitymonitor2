export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, company } = req.body;

    const goid = process.env.GOPAY_GOID;
    const clientId = process.env.GOPAY_CLIENT_ID;
    const clientSecret = process.env.GOPAY_CLIENT_SECRET;
    const isProduction = process.env.GOPAY_IS_PRODUCTION === 'true';

    // Výběr URL dle prostředí (Sandbox pro testy, Live pro ostrý provoz)
    const baseUrl = isProduction 
      ? 'https://gate.gopay.cz/api' 
      : 'https://gw.sandbox.gopay.com/api';

    // 1. Získání OAuth přístupového tokenu
    const tokenResponse = await fetch(`${baseUrl}/oauth/v2/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: 'grant_type=client_credentials&scope=payment-all'
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error('Chyba při komunikaci s GoPay (token): ' + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;

    // 2. Vytvoření platby (500 Kč = 50000 haléřů)
    const orderId = 'SM-' + Date.now();
    const origin = req.headers.origin || 'https://securitymonitor.cz';

    const paymentPayload = {
      payer: {
        default_payment_instrument: 'PAYMENT_CARD',
        contact: {
          email: email || 'zakaznik@securitymonitor.cz',
          first_name: name || 'Zákazník',
          phone_number: phone || ''
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

    const paymentResponse = await fetch(`${baseUrl}/payments/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok || !paymentData.gw_url) {
      throw new Error('Chyba při zakládání platby v GoPay: ' + JSON.stringify(paymentData));
    }

    // Vrátíme URL platební brány klientovi
    return res.status(200).json({ gw_url: paymentData.gw_url });

  } catch (error) {
    console.error('GoPay Error:', error);
    return res.status(500).json({ error: error.message });
  }
}