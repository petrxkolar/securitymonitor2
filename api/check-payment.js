export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Chybí ID platby.' });
    }

    const clientId = process.env.GOPAY_CLIENT_ID?.trim();
    const clientSecret = process.env.GOPAY_CLIENT_SECRET?.trim();
    const isProduction = process.env.GOPAY_IS_PRODUCTION?.trim() === 'true';

    if (!clientId || !clientSecret) {
      throw new Error('Chybí konfigurace GoPay proměnných prostředí.');
    }

    const baseUrl = isProduction 
      ? 'https://gate.gopay.cz/api' 
      : 'https://gw.sandbox.gopay.com/api';

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // 1. Získání OAuth tokenu
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('scope', 'payment-all');

    const tokenResponse = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error('Chyba při komunikaci s GoPay (token).');
    }

    // 2. Dotaz na aktuální stav platby dle GoPay API
    const paymentResponse = await fetch(`${baseUrl}/payments/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    const paymentData = await paymentResponse.json();
    if (!paymentResponse.ok) {
      throw new Error('Chyba při zjišťování stavu platby v GoPay.');
    }

    // Vrátíme stav platby (např. PAID, CANCELED, TIMEOUTED atd.)
    return res.status(200).json({ 
      state: paymentData.state,
      paymentData 
    });

  } catch (error) {
    console.error('GoPay Check Status Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}