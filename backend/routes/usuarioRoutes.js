import express from 'express';
import { 
  nuevoUsuario, 
  autenticar, 
  perfil, 
  obtenerUsuarios, 
  obtenerUsuarioPorId, 
  actualizarUsuario, 
  eliminarUsuario,
  obtenerUsuariosBloqueados,
  restaurarUsuario,
  eliminarUsuarioPermanente,
  solicitarRecuperacion,
  comprobarTokenPassword, // 🔗 Importamos la función que valida el token del correo
  nuevoPassword,          // 🔗 Importamos la función que guarda la nueva contraseña
  adminGenerarPassword
} from '../controllers/usuariosController.js';
import checkAuth from '../middleware/checkAuth.js';
import checkRole from '../middleware/checkRole.js';

const router = express.Router();

// =========================================
// AUTH & RECUPERACIÓN (RUTAS PÚBLICAS)
// =========================================
router.post('/login', autenticar);
router.get('/perfil', checkAuth, perfil);

// Nueva: Para el botón "Olvidé mi contraseña" en el formulario de Login
router.post('/olvide-password', solicitarRecuperacion);

// 🔐 Rutas para procesar la recuperación desde el correo electrónico
router.get('/olvide-password/:token', comprobarTokenPassword);
router.post('/olvide-password/:token', nuevoPassword);


// =========================================
// GESTIÓN GENERAL DE USUARIOS ACTIVOS
// =========================================
router.post('/registro', checkAuth, checkRole('admin', 'investigador'), nuevoUsuario);
router.get('/usuarios', checkAuth, checkRole('admin', 'investigador'), obtenerUsuarios); // Trae activos


// =========================================
// SECCIÓN DE ADMINISTRACIÓN DE BLOQUEADOS / REPORTADOS
// =========================================
router.get('/usuarios-bloqueados', checkAuth, checkRole('admin'), obtenerUsuariosBloqueados);
router.put('/usuarios-restaurar/:id', checkAuth, checkRole('admin'), restaurarUsuario);
router.delete('/usuarios-permanente/:id', checkAuth, checkRole('admin'), eliminarUsuarioPermanente);

// Nueva: Para que el administrador escriba la nueva contraseña de un usuario que la solicitó
router.put('/admin/generar-password/:id', checkAuth, checkRole('admin'), adminGenerarPassword);


// =========================================
// RUTAS CON PARÁMETROS DINÁMICOS (SIEMPRE AL FINAL)
// =========================================
router.get('/usuarios/:id', checkAuth, checkRole('admin'), obtenerUsuarioPorId);
router.put('/usuarios/:id', checkAuth, checkRole('admin'), actualizarUsuario);
router.delete('/usuarios/:id', checkAuth, checkRole('admin'), eliminarUsuario); // Bloqueo lógico

export default router;