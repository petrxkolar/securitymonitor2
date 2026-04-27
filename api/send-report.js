import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  try {
    const { reportHtml, name, pdfData } = req.body;

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'petrxkolar@seznam.cz',
      subject: `Security Report - ${name}`,
      html: reportHtml,
      attachments: [
        {
          filename: `Report_${name}.pdf`,
          content: pdfData, // Toto je ten Base64 řetězec z prohlížeče
        },
      ],
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
