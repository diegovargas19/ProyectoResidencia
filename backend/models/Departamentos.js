import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Departamentos = db.define(
  'departamentos',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default Departamentos;
