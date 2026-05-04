import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const { email, name, pdfData } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'Bezpečnostní Analýza <analyza@vasedomena.cz>', // Musí být vaše ověřená doména
       to: <petrxkolar@seznam.cz>,
      //to: [email], // Dynamický e-mail klienta z frontendu
      subject: `Security Report - ${name}`,
      html: `<p>Dobrý den, v příloze naleznete svůj report.</p>`,
      attachments: [
        {
          filename: 'report.pdf',
          content: pdfData,
        },
      ],
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
}
