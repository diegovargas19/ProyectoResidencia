import nodemailer from 'nodemailer';

const emailOlvidePassword = async (datos) => {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const { email, nombre, token } = datos;

  const urlRecuperacion = `${process.env.FRONTEND_URL}/nuevo-password/${token}`;

  const info = await transport.sendMail({
    from: '"Sistema de Gestión de Proyectos" <no-reply@tuinstitucion.com>',
    to: email,
    subject: 'Restablece tu contraseña - Sistema de Gestión',
    text: 'Restablece tu contraseña en nuestro sistema',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #3b82f6; text-align: center;">Hola, ${nombre}</h2>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          Has solicitado restablecer tu contraseña en el Sistema de Gestión de Proyectos. 
        </p>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          Haz clic en el siguiente botón para ingresar una nueva contraseña. Este enlace expira en 1 hora.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlRecuperacion}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
          Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>
      </div>
    `,
  });

  console.log('Mensaje enviado: %s', info.messageId);
};

export default emailOlvidePassword;