import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Ponecháno pro jistotu, i když HTML e-mail bude mít jen pár desítek KB
    },
  },
};

export default async function handler(req, res) {
  // Změna: Místo pdfData nyní přijímáme reportHtml, který obsahuje kompletní vygenerovaný design
  const { email, name, reportHtml } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Resend Sandbox <onboarding@resend.dev>', 
      to: ['petrxkolar@seznam.cz'], 
      subject: `Security Report - ${name}`,
      // Změna: Kompletní HTML kód se posílá přímo jako tělo e-mailu
      html: reportHtml, 
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
