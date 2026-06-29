import express from 'express';
import { obtenerDashboard } from '../controllers/dashboardController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

router.get('/', checkAuth, obtenerDashboard);

export default router;
