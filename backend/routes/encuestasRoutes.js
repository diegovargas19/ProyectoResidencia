import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import { 
  crearEncuesta, 
  obtenerEncuestas, 
  obtenerEncuesta, 
  actualizarEncuesta, 
  eliminarEncuesta,
  generarEnlacesMasivos, // 🔗 Importamos la nueva función para los links de un solo uso
  obtenerEncuestasEliminadas,
  restaurarEncuesta,
  eliminarEncuestaPermanente
} from '../controllers/encuestasController.js';

const router = express.Router();

// Rutas base
router.post('/', checkAuth, crearEncuesta);
router.get('/', checkAuth, obtenerEncuestas);

// 🔗 NUEVA RUTA: Generar lote de enlaces masivos de un solo uso
// Se coloca arriba para evitar conflictos con los endpoints dinámicos genéricos
router.post('/generar-enlace/:id', checkAuth, generarEnlacesMasivos);

// RUTAS DE LA PAPELERA (Estratégicamente arriba de los ':' dinámicos)
router.get('/eliminados', checkAuth, obtenerEncuestasEliminadas);
router.put('/restaurar/:id', checkAuth, restaurarEncuesta);

// NUEVA RUTA: BORRADO DEFINITIVO EN LA BASE DE DATOS
router.delete('/permanente/:id', checkAuth, eliminarEncuestaPermanente);

// Rutas con parámetros dinámicos
router.get('/:id', checkAuth, obtenerEncuesta);
router.put('/:id', checkAuth, actualizarEncuesta);
router.delete('/:id', checkAuth, eliminarEncuesta); // Borrado lógico (Papelera)

export default router;