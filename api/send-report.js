import { Resend } from 'resend';

export const config = {
  maxDuration: 30,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, attachmentBase64, filename } = req.body;

  if (!to || !subject || !attachmentBase64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // O PDF vem como Base64 Data URL (data:application/pdf;base64,xxxx)
    // Precisamos apenas da parte 'xxxx'
    const pureBase64 = attachmentBase64.split('base64,')[1] || attachmentBase64;

    const data = await resend.emails.send({
      from: 'Relatórios ThermIQ <relatorios@thermiqrelat.com>',
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h1 style="color: #f97316;">Relatório Operacional ThermIQ</h1>
          <p>Olá,</p>
          <p>O relatório operacional solicitado foi gerado com sucesso e está anexo a este e-mail.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
            Enviado via ThermIQ Relat — Sistema de Inteligência Operacional
          </p>
        </div>
      `,
      attachments: [
        {
          filename: filename || 'relatorio_thermiq.pdf',
          content: pureBase64,
        },
      ],
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: error.message });
  }
}
