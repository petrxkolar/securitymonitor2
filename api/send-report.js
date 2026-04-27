import { Resend } from 'resend';
const resend = new Resend('re_d5Z16HGb_YzRvEVqy1byo5QHyQ2kEv1xL');

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
