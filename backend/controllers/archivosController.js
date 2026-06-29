import ProyectoArchivos from '../models/ProyectoArchivos.js';
import Proyectos from '../models/Proyectos.js';
import { fechaYaPaso } from '../helpers/validarFechas.js';
import { usuarioPuedeAccederProyecto } from './proyectosController.js';

export const validarProyectoVigente = async (req, res, next) => {
  try {
    if (
      !['admin', 'investigador', 'colaborador'].includes(req.usuario.rol)
    ) {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;

    const proyecto = await Proyectos.findByPk(id);

    if (!proyecto) {
      return res.status(404).json({
        msg: 'Proyecto no encontrado',
      });
    }

    const puedeAcceder = await usuarioPuedeAccederProyecto(req.usuario, id);

    if (!puedeAcceder) {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    if (fechaYaPaso(proyecto.fecha_limite)) {
      return res.status(403).json({
        msg: 'La fecha limite del proyecto ya vencio',
      });
    }

    req.proyecto = proyecto;

    next();
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al validar proyecto',
    });
  }
};

// Subir archivos
export const subirArchivos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        msg: 'No se enviaron archivos',
      });
    }

    const archivosGuardados = [];

    for (const file of req.files) {
      const archivo = await ProyectoArchivos.create({
        proyecto_id: id,
        archivo: file.filename,
        nombre_original: file.originalname,
      });

      archivosGuardados.push(archivo);
    }

    res.json({
      msg: 'Archivos subidos correctamente',
      archivos: archivosGuardados,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al subir archivos',
    });
  }
};

// Descargar archivo
export const descargarArchivo = async (req, res) => {
  try {
    const { id } = req.params;

    const archivo = await ProyectoArchivos.findByPk(id);

    if (!archivo) {
      return res.status(404).json({
        msg: 'Archivo no encontrado',
      });
    }

    const puedeAcceder = await usuarioPuedeAccederProyecto(
      req.usuario,
      archivo.proyecto_id
    );

    if (!puedeAcceder) {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const rutaArchivo = `uploads/${archivo.archivo}`;

    return res.download(rutaArchivo, archivo.nombre_original);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al descargar archivo',
    });
  }
};

export const verArchivo = async (req, res) => {
  try {
    const { id } = req.params;

    const archivo = await ProyectoArchivos.findByPk(id);

    if (!archivo) {
      return res.status(404).json({
        msg: 'Archivo no encontrado',
      });
    }

    const puedeAcceder = await usuarioPuedeAccederProyecto(
      req.usuario,
      archivo.proyecto_id
    );

    if (!puedeAcceder) {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    return res.sendFile(archivo.archivo, {
      root: 'uploads',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al visualizar archivo',
    });
  }
};

// Eliminar archivo
export const eliminarArchivo = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;

    const archivo = await ProyectoArchivos.findByPk(id);

    if (!archivo) {
      return res.status(404).json({
        msg: 'Archivo no encontrado',
      });
    }

    await archivo.destroy();

    res.json({
      msg: 'Archivo eliminado',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al eliminar archivo',
    });
  }
};
