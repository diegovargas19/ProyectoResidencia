import jwt from 'jsonwebtoken';
import Usuarios from '../models/Usuarios.js';

const checkAuth = async (req, res, next) => {
  try {
    let token = null;

    // =========================================
    // TOKEN POR HEADER
    // =========================================
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // =========================================
    // TOKEN POR QUERY
    // =========================================
    if (!token && req.query.token) {
      token = req.query.token;
    }

    // =========================================
    // VALIDAR TOKEN
    // =========================================
    if (!token) {
      return res.status(401).json({
        msg: 'Token no proporcionado',
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        msg: 'Token no válido o expirado',
      });
    }

    const usuario = await Usuarios.findByPk(decoded.id, {
      attributes: {
        exclude: ['password', 'token'],
      },
    });

    if (!usuario) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    req.usuario = usuario;

    next();
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error en autenticación',
    });
  }
};

export default checkAuth;
