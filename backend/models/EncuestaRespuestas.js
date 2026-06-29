import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import EncuestaRespuestaDetalles from './EncuestaRespuestaDetalles.js';
import Usuarios from './Usuarios.js';

const EncuestaRespuestas = db.define(
  'encuesta_respuestas',
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

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    enlace_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    nombre_participante: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

EncuestaRespuestas.hasMany(EncuestaRespuestaDetalles, {
  foreignKey: 'respuesta_id',
  as: 'detalles',
});

EncuestaRespuestas.belongsTo(Usuarios, {
  foreignKey: 'usuario_id',
  as: 'usuario',
  constraints: false,
});

export default EncuestaRespuestas;
