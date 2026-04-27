const sgMail = require('@sendgrid/mail');

// Pro začátek můžete vložit klíč přímo (nedoporučuje se), 
// nebo použít Vercel Environment Variables (doporučeno).
sgMail.setApiKey('ZDE_BUDE_VAS_SENDGRID_API_KEY');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Pouze POST požadavky jsou povoleny.' });
  }

  const { email, reportHtml, name } = req.body;

  const msg = {
    to: 'petrxkolar@gmail.com', // Cílový e-mail
    from: 'petrxkolar@seznam.cz', // Musí být ověřený v SendGridu
    subject: `Security Monitor Report - ${name}`,
    text: 'Výsledky vaší bezpečnostní analýzy.',
    html: reportHtml,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chyba při odesílání e-mailu.' });
  }
}
