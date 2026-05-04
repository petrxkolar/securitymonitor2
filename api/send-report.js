import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Přidáme e-mail z body, i když ho zatím třeba nepoužijete
  const { email, name, pdfData } = req.body;

  try {
    const data = await resend.emails.send({
      // 1. ZMĚNA: Musí být přesně toto, pokud nemáte ověřenou doménu
      from: 'Resend Sandbox <onboarding@resend.dev>', 
      
      // 2. ZMĚNA: Musí to být e-mail, kterým se přihlašujete do Resendu
      to: ['petrxkolar@seznam.cz'], 
      
      subject: `Security Report - ${name}`,
      html: `<p>Dobrý den, v příloze naleznete svůj report pro uživatele ${name}.</p>`,
      attachments: [
        {
          filename: 'report.pdf',
          content: pdfData,
        },
      ],
    });

    // Pokud Resend vrátí chybu v objektu (např. 403), musíme ji zachytit
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
