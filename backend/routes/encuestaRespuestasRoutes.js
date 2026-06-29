import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import {
  responderEncuesta,
  obtenerEstadoRespuestaUsuario,
  obtenerRespuestasEncuesta,
} from '../controllers/encuestaRespuestasController.js';

const router = express.Router();

router.post('/:encuestaId', checkAuth, responderEncuesta);
router.get('/:encuestaId/estado', checkAuth, obtenerEstadoRespuestaUsuario);
router.get('/:encuestaId', checkAuth, obtenerRespuestasEncuesta);

export default router;
