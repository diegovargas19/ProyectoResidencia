import crypto from 'crypto'; 
import Encuestas from '../models/Encuentas.js';
import EncuestaRespuestas from '../models/EncuestaRespuestas.js';
import EncuestaEnlaces from '../models/EncuestaEnlaces.js'; 

// Crear encuesta
export const crearEncuesta = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { titulo, descripcion, proyecto_id, fecha_inicio, fecha_fin } = req.body;

    const encuesta = await Encuestas.create({
      titulo,
      descripcion,
      proyecto_id,
      fecha_inicio,
      fecha_fin,
      creado_por: req.usuario.id,
    });

    res.json(encuesta);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al crear encuesta',
    });
  }
};

// Obtener encuestas (Solo las ACTIVAS / NO ELIMINADAS)
export const obtenerEncuestas = async (req, res) => {
  try {
    const where = { eliminado: false };

    if (req.usuario.rol !== 'admin') {
      where.estado = ['Activa', 'Finalizada'];
    }

    const encuestas = await Encuestas.findAll({
      where,
      order: [['id', 'DESC']],
    });

    const encuestaIds = encuestas.map((encuesta) => encuesta.id);

    const conteos = await Promise.all(
      encuestaIds.map(async (encuestaId) => ({
        encuestaId,
        total: await EncuestaRespuestas.count({
          where: {
            encuesta_id: encuestaId,
          },
        }),
      }))
    );

    const respuestasPorEncuesta = conteos.reduce(
      (acc, item) => {
        acc[item.encuestaId] = item.total;
        return acc;
      },
      {}
    );

    const encuestasConConteo = encuestas.map((encuesta) => ({
      ...encuesta.toJSON(),
      respuestas: respuestasPorEncuesta[encuesta.id] || 0,
    }));

    res.json(encuestasConConteo);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al obtener encuestas',
    });
  }
};

// Obtener encuesta
export const obtenerEncuesta = async (req, res) => {
  try {
    const { id } = req.params;

    const encuesta = await Encuestas.findByPk(id);

    if (!encuesta || encuesta.eliminado) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    res.json(encuesta);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al obtener encuesta',
    });
  }
};

// Actualizar encuesta
export const actualizarEncuesta = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;

    const encuesta = await Encuestas.findByPk(id);

    if (!encuesta || encuesta.eliminado) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    const { titulo, descripcion, proyecto_id, fecha_inicio, fecha_fin, estado } = req.body;

    await encuesta.update({
      titulo: titulo ?? encuesta.titulo,
      descripcion: descripcion ?? encuesta.descripcion,
      proyecto_id: proyecto_id ?? encuesta.proyecto_id,
      fecha_inicio: fecha_inicio ?? encuesta.fecha_inicio,
      fecha_fin: fecha_fin ?? encuesta.fecha_fin,
      estado: estado ?? encuesta.estado,
    });

    await encuesta.reload();

    res.json(encuesta);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al actualizar encuesta',
    });
  }
};

// 🔗 Generar Enlaces Masivos de un Solo Uso (OPTIMIZADO)
export const generarEnlacesMasivos = async (req, res) => {
  try {
    const { id } = req.params;
    const cantidad = Number(req.body.cantidad) || 1;

    const encuesta = await Encuestas.findByPk(id);
    if (!encuesta || encuesta.eliminado) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    const registrosEnlaces = [];
    const enlacesGenerados = [];

    for (let i = 0; i < cantidad; i++) {
      const tokenUnico = crypto.randomUUID();
      
      registrosEnlaces.push({
        encuesta_id: id,
        token: tokenUnico,
        utilizado: false,
      });

      const urlCompleta = `${process.env.FRONTEND_URL}/responder/${tokenUnico}`;
      enlacesGenerados.push(urlCompleta);
    }

    // Guardamos todo el lote de una sola vez
    await EncuestaEnlaces.bulkCreate(registrosEnlaces);

    res.json({ enlaces: enlacesGenerados });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: 'Error al generar los enlaces masivos',
    });
  }
};

// Eliminar encuesta (BORRADO LÓGICO)
export const eliminarEncuesta = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;
    const encuesta = await Encuestas.findByPk(id);

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    await encuesta.update({ eliminado: true });

    res.json({
      msg: 'Encuesta enviada a la papelera de reciclaje',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al eliminar encuesta',
    });
  }
};

// Obtener encuestas eliminadas (Papelera)
export const obtenerEncuestasEliminadas = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const encuestas = await Encuestas.findAll({
      where: { eliminado: true },
      order: [['id', 'DESC']],
    });

    res.json(encuestas);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al obtener la papelera de encuestas',
    });
  }
};

// Restaurar una encuesta borrada
export const restaurarEncuesta = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;
    const encuesta = await Encuestas.findByPk(id);

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    await encuesta.update({ eliminado: false });

    res.json({
      msg: 'Encuesta restaurada con éxito',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al restaurar la encuesta',
    });
  }
};

// ELIMINAR ENCUESTA PERMANENTEMENTE (BORRADO FÍSICO)
export const eliminarEncuestaPermanente = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;
    const encuesta = await Encuestas.findByPk(id);

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    await encuesta.destroy();

    res.json({
      msg: 'Encuesta eliminada permanentemente de la base de datos',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al eliminar la encuesta de forma permanente',
    });
  }
};