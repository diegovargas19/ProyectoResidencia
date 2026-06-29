import express from 'express';
import { obtenerReportes } from '../controllers/reportesController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.get('/', checkAuth, obtenerReportes);

export default router;
