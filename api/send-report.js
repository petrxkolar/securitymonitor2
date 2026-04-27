import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
export default async function handler(req, res) {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // Pro testy, později vaše doména
      to: 'petrxkolar@seznam.cz',
      subject: 'Security Report',
      html: req.body.reportHtml,
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error });
  }
}
