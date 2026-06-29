import express from 'express';
import checkAuth from '../middleware/checkAuth.js';
import {
  generarEnlaceEncuesta,
  obtenerEncuestaPorEnlace,
  responderEncuestaPorEnlace,
} from '../controllers/encuestaEnlacesController.js';

const router = express.Router();

router.post('/:encuestaId', checkAuth, generarEnlaceEncuesta);
router.get('/publico/:token', obtenerEncuestaPorEnlace);
router.post('/publico/:token', responderEncuestaPorEnlace);

export default router;
