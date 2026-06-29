import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import Encuestas from './Encuentas.js';

const EncuestaPreguntas = db.define(
  'encuesta_preguntas',
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

    pregunta: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    obligatoria: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    opciones: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    orden: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    timestamps: true,
  }
);

Encuestas.hasMany(EncuestaPreguntas, {
  foreignKey: 'encuesta_id',
  as: 'preguntas',
});

EncuestaPreguntas.belongsTo(Encuestas, {
  foreignKey: 'encuesta_id',
  as: 'encuesta',
});

export default EncuestaPreguntas;
