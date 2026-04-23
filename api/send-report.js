// api/send-report.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda nepovolena' });
  }

  const { email, name, score, reportHtml } = JSON.parse(req.body);

  try {
    const data = await resend.emails.send({
      from: 'Security Monitor <onboarding@resend.dev>', // Později nahradíte svou doménou
      to: [email],
      subject: `Váš bezpečnostní report - Skóre: ${score}%`,
      html: `<h1>Ahoj ${name},</h1><p>zde jsou výsledky vaší analýzy:</p>${reportHtml}`,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
