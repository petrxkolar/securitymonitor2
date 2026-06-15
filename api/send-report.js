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
  // 1. Přidána proměnná 'email' do destrukturalizace
  const { name, email, reportHtml, htmlFileData } = req.body;

  // 2. Přidána validace, zda e-mail dorazil
  if (!htmlFileData || !email) {
    return res.status(400).json({ error: "Chybí data pro HTML přílohu nebo e-mail příjemce." });
  }

  try {
    const data = await resend.emails.send({
      from: 'Security Monitor <info@securitymonitor.cz>',
      to: [email], // 3. ZDE JE HLAVNÍ ZMĚNA: Používáme e-mail z formuláře
      subject: `Security Report - ${name}`,
      html: `
        <div style="font-family: sans-serif; color: #334155; max-width: 600px;">
          ${reportHtml}
          <p style="margin-top: 20px;">Přílohu si stáhněte do počítače a otevřete dvojklikem. Spustí se ve vašem prohlížeči v plné kvalitě a rozlišení.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 11px; color: #94a3b8;">Tato zpráva byla odeslána automaticky aplikací Security Monitor.</p>
        </div>
      `,
      attachments: [
        {
          filename: `security-report-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}.html`,
          content: htmlFileData,
        },
      ],
    });

    if (data.error) {
      console.error("Resend Error:", data.error);
      return res.status(403).json(data.error);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
