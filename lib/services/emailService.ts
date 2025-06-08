import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create transporter: real SMTP if env vars provided, else ethereal
async function createTransporter() {
  let transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
  // Verificar conexión SMTP
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');
  } catch (verifyError) {
    console.error('❌ SMTP connection failed:', verifyError);
  }
  return transporter;
}

export async function sendConfirmationEmail(to: string, confirmUrl: string) {
  const transporter = await createTransporter();

  const rawHtml = `
  <div style="font-family:Inter, sans-serif; background:#f0f4f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; border-radius:8px; overflow:hidden;">
      <div style="background:linear-gradient(90deg,#38bdf8,#22c55e);padding:20px;text-align:center;">
        <h1 style="color:white;margin:0;">BitPulse</h1>
      </div>
      <div style="padding:20px;color:#333;">
        <p>Gracias por registrarte en BitPulse.</p>
        <p>Haz clic en el siguiente botón para confirmar tu correo:</p>
        <p style="text-align:center;"><a href="${confirmUrl}" style="background:#38bdf8;color:white;padding:10px 20px;border-radius:4px;text-decoration:none;">Confirmar Correo</a></p>
        <hr style="border:none;border-top:1px solid #eee;"/>
        <p style="font-size:12px;color:#999;">Si no solicitaste este correo, puedes ignorarlo.</p>
      </div>
    </div>
  </div>
  `;
  const html = rawHtml;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@bitpulse.com',
    to,
    subject: 'Confirma tu correo en BitPulse',
    html,
  });

  // Log preview URL for test accounts
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('Preview email at:', preview);
} 