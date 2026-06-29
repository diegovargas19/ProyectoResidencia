import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import EncuestaPreguntas from './EncuestasPreguntas.js';

const EncuestaRespuestaDetalles = db.define(
  'encuesta_respuesta_detalles',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    respuesta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    pregunta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    respuesta: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

EncuestaRespuestaDetalles.belongsTo(EncuestaPreguntas, {
  foreignKey: 'pregunta_id',
  as: 'pregunta',
  constraints: false,
});

export default EncuestaRespuestaDetalles;
