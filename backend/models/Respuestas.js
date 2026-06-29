import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Respuestas = db.define('respuestas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    pregunta_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    respuesta_texto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha_respuesta: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false
});

export default Respuestas;