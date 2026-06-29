import { DataTypes } from 'sequelize';
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

const Usuarios = db.define(
  'usuarios',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    primer_apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    segundo_apellido: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    confirmado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    rol: {
      type: DataTypes.ENUM('admin', 'investigador', 'colaborador'),
      allowNull: false,
      defaultValue: 'colaborador',
    },

    bloqueado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Origen del bloqueo
    motivo_bloqueo: {
      type: DataTypes.ENUM('intentos_fallidos', 'bloqueo_manual'),
      allowNull: true,
      defaultValue: null,
    },

    // 🔐 NUEVOS CAMPOS PARA RECUPERACIÓN DE CONTRASEÑA
    token_password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },

    token_expiracion: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    timestamps: false,

    hooks: {
      beforeCreate: async (usuario) => {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      },

      beforeUpdate: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
    },
  }
);

Usuarios.prototype.verificarPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default Usuarios;