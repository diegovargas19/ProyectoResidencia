import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import Proyectos from './Proyectos.js';
import Usuarios from './Usuarios.js';

const ProyectoUsuarios = db.define(
  'proyecto_usuarios',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    rol_proyecto: {
      type: DataTypes.ENUM('investigador', 'colaborador'),
      allowNull: false,
      defaultValue: 'colaborador',
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['proyecto_id', 'usuario_id'],
      },
    ],
  }
);

Proyectos.hasMany(ProyectoUsuarios, {
  foreignKey: 'proyecto_id',
  as: 'asignaciones',
});

ProyectoUsuarios.belongsTo(Proyectos, {
  foreignKey: 'proyecto_id',
  as: 'proyecto',
});

ProyectoUsuarios.belongsTo(Usuarios, {
  foreignKey: 'usuario_id',
  as: 'usuario',
});

export default ProyectoUsuarios;
