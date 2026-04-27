// api/send-report.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, reportHtml, pdfData } = req.body;

    const data = await resend.emails.send({
      from: 'Security Monitor <onboarding@resend.dev>', // Nebo vaše ověřená doména
      to: ['vas-email@seznam.cz'], // Zkuste sem dát pevný email pro test
      subject: `Bezpečnostní Report - ${name}`,
      html: reportHtml,
      attachments: [
        {
          filename: 'report.pdf',
          content: pdfData, // Resend očekává Base64 řetězec, který posíláme
        },
      ],
    });

    return res.status(200).json(data);
  } catch (error) {
    // Tady je kritické logovat chybu na serveru
    console.error("Resend Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
