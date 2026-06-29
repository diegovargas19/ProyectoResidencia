import express from 'express';
import {
  crearDepartamento,
  eliminarDepartamento,
  obtenerDepartamentos,
} from '../controllers/departamentosController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.get('/', checkAuth, obtenerDepartamentos);
router.post('/', checkAuth, crearDepartamento);
router.delete('/:id', checkAuth, eliminarDepartamento);

export default router;
