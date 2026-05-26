import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Ponecháno pro případné větší textové reporty
    },
  },
};

export default async function handler(req, res) {
  // Vytáhneme přesně ty proměnné, které posíláte z frontendu
  const { name, reportHtml, htmlFileData } = req.body;

  if (!htmlFileData) {
    return res.status(400).json({ error: "Chybí data pro HTML přílohu." });
  }

  try {
    const data = await resend.emails.send({
      from: 'Resend Sandbox <onboarding@resend.dev>', 
      to: ['petrxkolar@seznam.cz'], 
      subject: `Security Report - ${name}`,
      // Použijeme text/html průvodní zprávu, kterou posíláte z frontendu
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
          // Převede jméno na formát bezpečný pro název souboru (např. "jan-novak.html")
          filename: `security-report-${name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}.html`,
          content: htmlFileData, // Base64 řetězec z frontendu
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
