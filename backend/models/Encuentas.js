import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Encuestas = db.define(
  'encuestas',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    proyecto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    estado: {
      type: DataTypes.STRING(50),
      defaultValue: 'Borrador',
    },

    // 1. NUEVO CAMPO PARA EL BORRADO LÓGICO
    eliminado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Encuestas;