const crearContenidoCorreo = ({ email, nombre, token }) => {
  const urlRecuperacion = `${process.env.FRONTEND_URL}/nuevo-password/${token}`;

  return {
    to: email,
    subject: 'Restablece tu contrasena - Sistema de Gestion',
    text: `Hola, ${nombre}. Para restablecer tu contrasena entra a este enlace: ${urlRecuperacion}. El enlace expira en 1 hora.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #3b82f6; text-align: center;">Hola, ${nombre}</h2>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          Has solicitado restablecer tu contrasena en el Sistema de Gestion de Proyectos.
        </p>
        <p style="font-size: 16px; line-height: 1.5; text-align: center;">
          Haz clic en el siguiente boton para ingresar una nueva contrasena. Este enlace expira en 1 hora.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlRecuperacion}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
            Restablecer contrasena
          </a>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; text-align: center; word-break: break-all;">
          Si el boton no funciona, copia y pega este enlace en tu navegador:<br>
          ${urlRecuperacion}
        </p>
        <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
          Si tu no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>
      </div>
    `,
  };
};

const emailOlvidePassword = async (datos) => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey) {
    throw new Error('Falta configurar RESEND_API_KEY en el archivo .env');
  }

  if (!from) {
    throw new Error('Falta configurar EMAIL_FROM en el archivo .env');
  }

  const contenido = crearContenidoCorreo(datos);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [contenido.to],
      subject: contenido.subject,
      html: contenido.html,
      text: contenido.text,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Resend API error ${response.status}`);
  }

  console.log('Mensaje enviado por Resend: %s', data.id);
};

export default emailOlvidePassword;
