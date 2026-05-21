import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Zvýší limit pro příjem dat na 10 MB
    },
  },
};

export default async function handler(req, res) {
  // Změna: Přijímáme htmlData místo pdfData
  const { email, name, htmlData } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Resend Sandbox <onboarding@resend.dev>', 
      to: [email || 'petrxkolar@seznam.cz'], // Použije zadaný email nebo fallback
      subject: `Security Report - ${name}`,
      html: `<p>Dobrý den,<br><br>V příloze tohoto e-mailu naleznete svůj vygenerovaný bezpečnostní report pro uživatele <strong>${name}</strong>.<br>Soubor si můžete stáhnout a otevřít v jakémkoliv webovém prohlížeči (Chrome, Firefox, Safari, Edge).</p>`,
      attachments: [
        {
          filename: 'report.html', // Změna: Koncovka .html
          content: htmlData,       // Base64 řetězec HTML dokumentu
        },
      ],
    });

    if (data.error) {
      console.error("Resend Error:", data.error);
      return res.status(403).json(data.error);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: error.message });
  }
}
