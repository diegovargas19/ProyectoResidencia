import db from '../config/db.js';

const actualizarEnums = async () => {
  try {
    await db.authenticate();

    await db.query(`
      ALTER TABLE usuarios
      MODIFY rol ENUM('admin', 'investigador', 'colaborador', 'visor')
      NOT NULL DEFAULT 'visor'
    `);

    await db.query(`
      ALTER TABLE proyecto_usuarios
      MODIFY rol_proyecto ENUM('investigador', 'colaborador')
      NOT NULL DEFAULT 'colaborador'
    `);

    console.log('Enums de roles actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar enums de roles');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
};

actualizarEnums();
