import express from 'express';
import { subirArchivos, eliminarArchivo, descargarArchivo, verArchivo, validarProyectoVigente } from '../controllers/archivosController.js';
import checkAuth from '../middleware/checkAuth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/:id', checkAuth, validarProyectoVigente, upload.array('archivos', 10), subirArchivos);
router.get('/ver/:id', checkAuth, verArchivo);
router.get('/descargar/:id', checkAuth, descargarArchivo);
router.delete('/:id', checkAuth, eliminarArchivo);

export default router;
