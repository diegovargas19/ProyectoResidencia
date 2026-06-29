import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const ProyectoArchivos = db.define(
  'proyecto_archivos',
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

    archivo: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default ProyectoArchivos;
