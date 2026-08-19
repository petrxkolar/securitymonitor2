import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderNumber, customer, pdfBase64 } = req.body;

  // --- DIAGNOSTICKÉ LOGY ---
  console.log("--- DEBUG START ---");
  console.log("Číslo objednávky:", orderNumber);
  console.log("Zákazník:", customer?.email);
  console.log("Přijatá délka pdfBase64:", pdfBase64 ? pdfBase64.length : "NEDOŠLO (undefined/null)");
  console.log("Začátek řetězce pdfBase64:", pdfBase64 ? pdfBase64.substring(0, 50) : "N/A");
  // -------------------------

  if (!pdfBase64 || !customer || !customer.email || !orderNumber) {
    return res.status(400).json({ error: "Chybí data pro PDF přílohu, e-mail zákazníka nebo číslo objednávky." });
  }

  try {
    const base64Data = pdfBase64.includes(';base64,') 
      ? pdfBase64.split(';base64,').pop() 
      : pdfBase64;

    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    // --- DALŠÍ LOG ---
    console.log("Velikost vytvořeného PDF Bufferu v bytech:", pdfBuffer.length);
    console.log("--- DEBUG END ---");

    if (pdfBuffer.length === 0) {
      return res.status(400).json({ error: "Vygenerovaný PDF Buffer je prázdný (0 bajtů)." });
    }

    const data = await resend.emails.send({
      from: 'Security Monitor <info@securitymonitor.cz>',
      to: [customer.email, 'info@securitymonitor.cz'],
      subject: `Potvrzení objednávky #${orderNumber}`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Děkujeme za vaši objednávku!</h2>
            <p>Dobrý den, <strong>${customer.name}</strong>,</p>
            <p>vaše platba proběhla úspěšně a objednávka byla zaregistrována.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Číslo objednávky:</strong> ${orderNumber}</p>
                <p style="margin: 5px 0;"><strong>Položka:</strong> Základní bezpečnostní analýza</p>
                <p style="margin: 5px 0;"><strong>Celkem:</strong> 500 Kč</p>
            </div>
            
            <p>V příloze tohoto e-mailu naleznete oficiální potvrzení objednávky / daňový doklad v PDF.</p>
            <p>Nyní se můžete vrátit do aplikace a pokračovat ve vyhodnocení.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="font-size: 11px; color: #64748b;">Tato zpráva byla odeslána automaticky aplikací Security Monitor (<a href="https://securitymonitor.cz" style="color: #4f46e5;">securitymonitor.cz</a>).</p>
        </div>
      `,
      attachments: [
        {
          filename: `objednavka-${orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf', // Explicitně definujeme typ
        },
      ],
    });

    if (data.error) {
      console.error("Resend Error:", data.error);
      return res.status(403).json(data.error);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(errors.message);
  }
}
