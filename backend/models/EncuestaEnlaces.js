import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const EncuestaEnlaces = db.define(
  'encuesta_enlaces',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    encuesta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },

    usado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    usado_en: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    respuesta_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

export default EncuestaEnlaces;
