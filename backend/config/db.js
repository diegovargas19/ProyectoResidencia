import Sequelize from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Aseguramos la carga del .env localmente también por si el orden de importación de Node se adelanta
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Valores por defecto (Fallback) si el .env no responde, para evitar el error de usuario vacío ''
const dbNombre = process.env.BD_NOMBRE || 'tu_base_de_datos';
const dbUser = process.env.BD_USER || 'root';
const dbPass = process.env.BD_PASS || '';
const dbHost = process.env.BD_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;

console.log(`📡 Intentando conectar a la DB: ${dbNombre} con el usuario: ${dbUser} en ${dbHost}`);

const db = new Sequelize(
  dbNombre, 
  dbUser, 
  dbPass, 
  {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    define: {
        timestamps: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: false, // Limpia la consola de texto basura de SQL
    operatorAliases: false
  }
);

export default db;