import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- TATO ČÁST JE KLÍČOVÁ ---
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Zvýší limit pro příjem dat na 10 MB
    },
  },
};

export default async function handler(req, res) {
  const { email, name, pdfData } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Resend Sandbox <onboarding@resend.dev>', 
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
