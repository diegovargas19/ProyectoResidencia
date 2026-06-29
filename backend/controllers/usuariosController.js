import crypto from 'crypto';
import Usuarios from '../models/Usuarios.js';
import generarJWT from '../helpers/generarJWT.js';
import emailOlvidePassword from '../helpers/emailOlvidePassword.js'; // ✉️ Importamos el helper de correo

// Objeto temporal en memoria para contar los intentos por correo electrónico (No consume base de datos)
const intentosLogin = {};

// =========================================
// REGISTRO
// =========================================
export const nuevoUsuario = async (req, res) => {
  try {
    if (req.usuario?.rol === 'investigador') {
      req.body.rol = 'colaborador';
    }

    const { email } = req.body;

    const existeUsuario = await Usuarios.findOne({
      where: { email },
    });

    if (existeUsuario) {
      return res.status(400).json({
        msg: 'El usuario ya está registrado',
      });
    }

    const usuario = await Usuarios.create(req.body);

    res.json({
      msg: 'Usuario creado correctamente',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        primer_apellido: usuario.primer_apellido,
        segundo_apellido: usuario.segundo_apellido,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al crear usuario',
    });
  }
};

// =========================================
// LOGIN (CON CONTADOR DE 5 INTENTOS)
// =========================================
export const autenticar = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuarios.findOne({
      where: { email },
    });

    if (!usuario) {
      return res.status(404).json({
        msg: 'El usuario no existe',
      });
    }

    // CANDADO 1: Comprobar si el usuario está bloqueado
    if (usuario.bloqueado) {
      return res.status(403).json({
        msg: 'Tu cuenta ha sido bloqueada por seguridad debido a exceso de intentos fallidos o suspensión. Contacta al administrador del sistema.',
      });
    }

    if (!usuario.confirmado) {
      return res.status(403).json({
        msg: 'Tu cuenta no ha sido confirmada',
      });
    }

    const passwordCorrecto = await usuario.verificarPassword(password);

    // CONTROL DE INTENTOS SI EL PASSWORD ES ERRÓNEO
    if (!passwordCorrecto) {
      intentosLogin[email] = (intentosLogin[email] || 0) + 1;
      const intentosRestantes = 5 - intentosLogin[email];

      if (intentosLogin[email] >= 5) {
        // Bloqueamos al usuario — motivo: intentos fallidos
        await usuario.update({ 
          bloqueado: true,
          motivo_bloqueo: 'intentos_fallidos',
        });
        delete intentosLogin[email];

        return res.status(403).json({
          msg: 'Has alcanzado el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada automáticamente.',
        });
      }

      return res.status(403).json({
        msg: `El password es incorrecto. Intentos restantes: ${intentosRestantes}/5`,
      });
    }

    // SI EL PASSWORD ES CORRECTO, LIMPIAMOS SUS INTENTOS DE MEMORIA
    delete intentosLogin[email];

    const token = generarJWT(usuario.id);
    usuario.token = token;
    await usuario.save();

    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      primer_apellido: usuario.primer_apellido,
      segundo_apellido: usuario.segundo_apellido,
      email: usuario.email,
      rol: usuario.rol,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al iniciar sesión',
    });
  }
};

// =========================================
// PERFIL
// =========================================
export const perfil = async (req, res) => {
  res.json(req.usuario);
};

// =========================================
// OBTENER TODOS (SOLO NO BLOQUEADOS)
// =========================================
export const obtenerUsuarios = async (req, res) => {
  try {
    const where =
      req.usuario.rol === 'investigador'
        ? { rol: 'colaborador', bloqueado: false }
        : { bloqueado: false };

    const usuarios = await Usuarios.findAll({
      where,
      attributes: {
        exclude: ['password'],
      },
      order: [['id', 'DESC']],
    });

    res.json(usuarios);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al obtener usuarios',
    });
  }
};

// =========================================
// OBTENER POR ID
// =========================================
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuarios.findByPk(id, {
      attributes: {
        exclude: ['password', 'token'],
      },
    });

    if (!usuario) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al obtener usuario',
    });
  }
};

// =========================================
// ACTUALIZAR
// =========================================
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    if (req.body.email) {
      const existeEmail = await Usuarios.findOne({
        where: {
          email: req.body.email,
        },
      });

      if (existeEmail && existeEmail.id !== usuario.id) {
        return res.status(400).json({
          msg: 'Ese email ya está registrado',
        });
      }
    }

    await usuario.update(req.body);

    res.json({
      msg: 'Usuario actualizado correctamente',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al actualizar usuario',
    });
  }
};

// =========================================
// ELIMINAR (BLOQUEO LÓGICO MANUAL POR ADMIN)
// =========================================
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        msg: 'No puedes bloquear tu propia cuenta',
      });
    }

    await usuario.update({ 
      bloqueado: true,
      motivo_bloqueo: 'bloqueo_manual',
    }); 
    res.json({
      msg: 'Usuario miembro suspendido y enviado al apartado correspondiente',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al bloquear usuario',
    });
  }
};

// =========================================
// OBTENER USUARIOS BLOQUEADOS
// =========================================
export const obtenerUsuariosBloqueados = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const usuarios = await Usuarios.findAll({
      where: { bloqueado: true },
      attributes: {
        exclude: ['password', 'token'],
      },
      order: [['id', 'DESC']],
    });

    res.json(usuarios);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al obtener usuarios bloqueados',
    });
  }
};

// =========================================
// RESTAURAR / DESBLOQUEAR
// =========================================
export const restaurarUsuario = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const { id } = req.params;
    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    await usuario.update({ 
      bloqueado: false,
      motivo_bloqueo: null,
      token: null,
    });

    res.json({
      msg: 'Usuario restaurado y desbloqueado correctamente.',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al restaurar usuario',
    });
  }
};

// =========================================
// ELIMINAR USUARIO PERMANENTE
// =========================================
export const eliminarUsuarioPermanente = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const { id } = req.params;
    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    await usuario.destroy();

    res.json({
      msg: 'Usuario eliminado permanentemente del sistema',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al eliminar usuario permanentemente',
    });
  }
};

// =========================================
// 🔐 SOLICITAR RECUPERACIÓN (MÉTODO AUTOMÁTICO POR CORREO)
// =========================================
export const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuarios.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({
        msg: 'El correo ingresado no coincide con ninguna cuenta activa.',
      });
    }

    // Generamos un token aleatorio seguro y una expiración de 1 hora
    const tokenSeguro = crypto.randomBytes(20).toString('hex');
    const tiempoExpiracion = new Date(Date.now() + 3600000); // 1 hora en milisegundos

    await usuario.update({
      token_password: tokenSeguro,
      token_expiracion: tiempoExpiracion
    });

    // Despachamos el correo usando el helper
    await emailOlvidePassword({
      email: usuario.email,
      nombre: usuario.nombre,
      token: tokenSeguro,
    });

    res.json({
      msg: 'Hemos enviado un correo electrónico con las instrucciones para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: 'Error al procesar la solicitud de recuperación',
    });
  }
};

// =========================================
// 🔐 COMPROBAR EL TOKEN DEL CORREO
// =========================================
export const comprobarTokenPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuarios.findOne({ where: { token_password: token } });

    if (!usuario) {
      return res.status(404).json({ msg: 'El enlace de recuperación no es válido.' });
    }

    // Verificar si el token ya expiró comparando fechas
    if (new Date() > usuario.token_expiracion) {
      return res.status(400).json({ msg: 'El enlace de recuperación ha caducado. Solicita uno nuevo.' });
    }

    res.json({ msg: 'Token válido. El usuario puede cambiar su contraseña.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al validar el token.' });
  }
};

// =========================================
// 🔐 GUARDAR LA NUEVA CONTRASEÑA
// =========================================
export const nuevoPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const usuario = await Usuarios.findOne({ where: { token_password: token } });

    if (!usuario) {
      return res.status(404).json({ msg: 'Operación no válida.' });
    }

    if (new Date() > usuario.token_expiracion) {
      return res.status(400).json({ msg: 'El enlace ha expirado.' });
    }

    // Actualizamos los campos. El hook beforeUpdate se encargará de encriptarla.
    usuario.password = password;
    usuario.token_password = null;
    usuario.token_expiracion = null;
    usuario.bloqueado = false; // Desbloqueamos si venía de un exceso de intentos
    usuario.motivo_bloqueo = null;
    
    await usuario.save();

    res.json({ msg: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al guardar la nueva contraseña.' });
  }
};

// =========================================
// ADMIN ASIGNA CONTRASEÑA NUEVA (Mantenido por compatibilidad)
// =========================================
export const adminGenerarPassword = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const { id } = req.params;
    const { nuevaPassword } = req.body;

    const usuario = await Usuarios.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    await usuario.update({
      password: nuevaPassword,
      bloqueado: false,
      motivo_bloqueo: null,
      token: null
    });

    res.json({
      msg: `Contraseña restablecida con éxito para ${usuario.nombre}. Ya puede iniciar sesión.`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al asignar la nueva contraseña desde el administrador',
    });
  }
};