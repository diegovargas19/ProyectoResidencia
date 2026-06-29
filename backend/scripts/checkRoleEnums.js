import db from '../config/db.js';

try {
  await db.authenticate();

  const [usuarioRol] = await db.query(
    "SHOW COLUMNS FROM usuarios LIKE 'rol'"
  );
  const [proyectoRol] = await db.query(
    "SHOW COLUMNS FROM proyecto_usuarios LIKE 'rol_proyecto'"
  );

  console.log('usuarios.rol:', usuarioRol[0]?.Type);
  console.log('proyecto_usuarios.rol_proyecto:', proyectoRol[0]?.Type);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.close();
}
