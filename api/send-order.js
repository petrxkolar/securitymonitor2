import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderNumber, customer } = req.body;

  // Validace povinných údajů
  if (!customer || !customer.email || !orderNumber) {
    return res.status(400).json({ error: "Chybí e-mail zákazníka nebo číslo objednávky." });
  }

  try {
    const nowFormatted = new Date().toLocaleDateString('cs-CZ');

    const data = await resend.emails.send({
      from: 'Security Monitor <info@securitymonitor.cz>',
      to: [customer.email, 'info@securitymonitor.cz'],
      subject: `Potvrzení objednávky #${orderNumber}`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Děkujeme za vaši objednávku!</h2>
            <p>Dobrý den, <strong>${customer.name}</strong>,</p>
            <p>vaše platba proběhla úspěšně a objednávka byla zaregistrována.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Číslo objednávky:</strong> ${orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Datum:</strong> ${nowFormatted}</p>
                <p style="margin: 5px 0;"><strong>Položka:</strong> Základní bezpečnostní analýza</p>
                <p style="margin: 5px 0;"><strong>Celkem:</strong> 500 Kč</p>
            </div>

            <h3 style="font-size: 14px; color: #0f172a; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Údaje o odběrateli:</h3>
            <p style="margin: 4px 0;"><strong>Jméno:</strong> ${customer.name}</p>
            <p style="margin: 4px 0;"><strong>Společnost:</strong> ${customer.company || '-'}</p>
            <p style="margin: 4px 0;"><strong>E-mail:</strong> ${customer.email}</p>
            <p style="margin: 4px 0;"><strong>Telefon:</strong> ${customer.phone || '-'}</p>
            
            <p style="margin-top: 25px;">Nyní se můžete vrátit do aplikace a pokračovat ve vyhodnocení.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="font-size: 11px; color: #64748b;">Tato zpráva byla odeslána automaticky aplikací Security Monitor (<a href="https://securitymonitor.cz" style="color: #4f46e5;">securitymonitor.cz</a>).</p>
        </div>
      `,
    });

    if (data.error) {
      console.error("Resend Error:", data.error);
      return res.status(403).json(data.error);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
