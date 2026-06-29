import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import ProyectoArchivos from './ProyectoArchivos.js';

const Proyectos = db.define(
  'proyectos',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre_proyecto: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },

    investigador_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    departamento: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    estado: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    prioridad: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    fecha_limite: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    // NUEVA COLUMNA PARA LA PAPELERA
    eliminado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Por defecto, ningún proyecto está eliminado
    },
  },
  {
    timestamps: false, // Mantienes tu configuración actual
  },
);

// RELACIONES
Proyectos.hasMany(ProyectoArchivos, {
  foreignKey: 'proyecto_id',
  as: 'archivos',
});

export default Proyectos;