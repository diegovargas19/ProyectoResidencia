import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import { obtenerPreguntasEncuesta, guardarPreguntasEncuesta } from '../controllers/encuestaPreguntasController.js';

const router = express.Router();

router.get('/:encuestaId', checkAuth, obtenerPreguntasEncuesta);
router.post('/:encuestaId', checkAuth, guardarPreguntasEncuesta);

export default router;
