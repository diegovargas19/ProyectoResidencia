import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 1. CONFIGURACIÓN INMUNE A LA UBICACIÓN DE LA TERMINAL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// 2. IMPORTACIONES DE RUTAS (Apuntando exactamente a tu archivo ususarioRoutes.js)
import usuarioRoutes from './routes/ususarioRoutes.js'; 
import proyectosRoutes from './routes/proyectosRoutes.js';
import archivosRoutes from './routes/archivosRoutes.js';
import encuestasRoutes from './routes/encuestasRoutes.js';
import encuestaPreguntasRoutes from './routes/encuestaPreguntasRoutes.js';
import encuestaRespuestasRoutes from './routes/encuestaRespuestasRoutes.js';
import encuestaEnlacesRoutes from './routes/encuestaEnlacesRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import departamentosRoutes from './routes/departamentosRoutes.js';
import db from './config/db.js';

// MODELOS
import './models/Usuarios.js';
import './models/Proyectos.js';
import './models/ProyectoUsuarios.js';
import './models/ProyectoArchivos.js';
import './models/Departamentos.js';
import './models/Encuentas.js';
import './models/EncuestasPreguntas.js';
import './models/EncuestaRespuestas.js';
import './models/EncuestaRespuestaDetalles.js';
import './models/EncuestaEnlaces.js';

const app = express();
const httpServer = createServer(app);

// MIDDLEWARES

// Carpeta pública para archivos
app.use('/uploads', express.static('uploads'));

// Leer JSON
app.use(express.json());

// Leer form-data
app.use(express.urlencoded({ extended: true }));

// CORS
const whitelist = [process.env.FRONTEND_URL];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Error de CORS'));
    }
  },
};

app.use(cors(corsOptions));

// RUTAS API
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/archivos', archivosRoutes);
app.use('/api/encuestas', encuestasRoutes);
app.use('/api/encuestas-preguntas', encuestaPreguntasRoutes);
app.use('/api/encuestas-respuestas', encuestaRespuestasRoutes);
app.use('/api/encuestas-enlaces', encuestaEnlacesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/departamentos', departamentosRoutes);

// CONEXIÓN DB
const conectarDB = async () => {
  try {
    await db.authenticate();

    console.log('✅ Base de datos conectada');

    const syncOptions = process.env.DB_SYNC_ALTER === 'true' ? { alter: true } : {};
    await db.sync(syncOptions);

    console.log('✅ Tablas sincronizadas');

    // Servidor
    const PORT = process.env.PORT || 4000;

    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.log('❌ Error conectando DB');
    console.error(error);
  }
};

conectarDB();