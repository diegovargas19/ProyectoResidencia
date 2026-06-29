import express from 'express';
import {
  crearProyecto,
  obtenerProyectos,
  obtenerProyecto,
  actualizarProyecto,
  eliminarProyecto,
  actualizarColaboradoresProyecto,
  obtenerProyectosEliminados,
  restaurarProyecto,
  // 1. IMPORTAMOS LA NUEVA FUNCIÓN DE BORRADO FÍSICO
  eliminarProyectoPermanente,
} from '../controllers/proyectosController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

// Rutas base
router.post('/', checkAuth, crearProyecto);
router.get('/', checkAuth, obtenerProyectos);

// RUTAS DE LA PAPELERA (Puestas arriba de los parámetros dinámicos ':id')
router.get('/eliminados', checkAuth, obtenerProyectosEliminados);
router.put('/restaurar/:id', checkAuth, restaurarProyecto);
// 2. NUEVA RUTA: BORRADO DEFINITIVO EN LA BASE DE DATOS
router.delete('/permanente/:id', checkAuth, eliminarProyectoPermanente);

// Rutas con ID
router.get('/:id', checkAuth, obtenerProyecto);
router.put('/:id', checkAuth, actualizarProyecto);
router.put('/:id/colaboradores', checkAuth, actualizarColaboradoresProyecto);
router.delete('/:id', checkAuth, eliminarProyecto);

export default router;