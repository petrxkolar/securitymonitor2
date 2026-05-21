import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const { email, name, htmlData } = req.body;

  try {

    if (!htmlData) {
      return res.status(400).json({
        error: 'Chybí htmlData'
      });
    }

    const data = await resend.emails.send({
      from: 'Security Monitor <onboarding@resend.dev>',
      to: [email || 'petrxkolar@seznam.cz'],
      subject: `Security Report - ${name}`,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Dobrý den,</h2>

          <p>
            v příloze naleznete svůj bezpečnostní report
            pro uživatele <strong>${name}</strong>.
          </p>

          <p>
            Soubor otevřete v libovolném webovém prohlížeči.
          </p>

          <br>

          <p>
            Security Monitor
          </p>
        </div>
      `,

      attachments: [
        {
          filename: 'security-report.html',

          // HTML string přímo
          content: Buffer.from(htmlData).toString('base64'),
        },
      ],
    });

    if (data.error) {
      console.error('Resend Error:', data.error);

      return res.status(403).json(data.error);
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error('Server Error:', error);

    return res.status(500).json({
      error: error.message
    });
  }
}
