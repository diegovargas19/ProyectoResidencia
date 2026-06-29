const checkRole = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        msg: 'No autenticado',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        msg: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};

export default checkRole;
