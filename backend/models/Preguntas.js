import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Preguntas = db.define('preguntas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    encuesta_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    texto_pregunta: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo_respuesta: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    timestamps: false
});

export default Preguntas;