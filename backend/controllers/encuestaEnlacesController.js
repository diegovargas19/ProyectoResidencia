import crypto from 'crypto';
import db from '../config/db.js';
import Encuestas from '../models/Encuentas.js';
import EncuestaEnlaces from '../models/EncuestaEnlaces.js';
import EncuestaPreguntas from '../models/EncuestasPreguntas.js';
import EncuestaRespuestas from '../models/EncuestaRespuestas.js';
import EncuestaRespuestaDetalles from '../models/EncuestaRespuestaDetalles.js';
import { fechaNoHaIniciado, fechaYaPaso } from '../helpers/validarFechas.js';

const validarEncuestaDisponible = (encuesta) => {
  if (encuesta.estado !== 'Activa') {
    return 'Esta encuesta no esta activa para recibir respuestas';
  }

  if (fechaNoHaIniciado(encuesta.fecha_inicio)) {
    return 'La encuesta aun no esta disponible';
  }

  if (fechaYaPaso(encuesta.fecha_fin)) {
    return 'La fecha para responder esta encuesta ya vencio';
  }

  return null;
};

const formatearPreguntas = (preguntas) =>
  preguntas.map((pregunta) => ({
    ...pregunta.toJSON(),
    opciones: pregunta.opciones ? JSON.parse(pregunta.opciones) : [],
  }));

export const generarEnlaceEncuesta = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { encuestaId } = req.params;

    const encuesta = await Encuestas.findByPk(encuestaId);

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');

    const enlace = await EncuestaEnlaces.create({
      encuesta_id: encuestaId,
      token,
    });

    res.json({
      id: enlace.id,
      token,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al generar enlace',
    });
  }
};

export const obtenerEncuestaPorEnlace = async (req, res) => {
  try {
    const { token } = req.params;

    const enlace = await EncuestaEnlaces.findOne({
      where: {
        token,
      },
    });

    if (!enlace) {
      return res.status(404).json({
        msg: 'Enlace no encontrado',
      });
    }

    if (enlace.usado) {
      return res.status(410).json({
        msg: 'Este enlace ya fue utilizado',
      });
    }

    const encuesta = await Encuestas.findByPk(enlace.encuesta_id, {
      include: [
        {
          model: EncuestaPreguntas,
          as: 'preguntas',
        },
      ],
    });

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    const errorDisponibilidad = validarEncuestaDisponible(encuesta);

    if (errorDisponibilidad) {
      return res.status(403).json({
        msg: errorDisponibilidad,
      });
    }

    res.json({
      id: encuesta.id,
      titulo: encuesta.titulo,
      descripcion: encuesta.descripcion,
      fecha_inicio: encuesta.fecha_inicio,
      fecha_fin: encuesta.fecha_fin,
      preguntas: formatearPreguntas(encuesta.preguntas),
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener encuesta',
    });
  }
};

export const responderEncuestaPorEnlace = async (req, res) => {
  const transaction = await db.transaction();

  try {
    const { token } = req.params;
    const { nombre_completo, respuestas } = req.body;
    const nombreParticipante = nombre_completo?.trim();

    if (!nombreParticipante) {
      await transaction.rollback();

      return res.status(400).json({
        msg: 'El nombre completo es obligatorio',
      });
    }

    const enlace = await EncuestaEnlaces.findOne({
      where: {
        token,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!enlace) {
      await transaction.rollback();

      return res.status(404).json({
        msg: 'Enlace no encontrado',
      });
    }

    if (enlace.usado) {
      await transaction.rollback();

      return res.status(410).json({
        msg: 'Este enlace ya fue utilizado',
      });
    }

    const encuesta = await Encuestas.findByPk(enlace.encuesta_id, {
      transaction,
    });

    if (!encuesta) {
      await transaction.rollback();

      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    const errorDisponibilidad = validarEncuestaDisponible(encuesta);

    if (errorDisponibilidad) {
      await transaction.rollback();

      return res.status(403).json({
        msg: errorDisponibilidad,
      });
    }

    const respuestaEncuesta = await EncuestaRespuestas.create(
      {
        encuesta_id: encuesta.id,
        usuario_id: null,
        enlace_id: enlace.id,
        nombre_participante: nombreParticipante,
      },
      {
        transaction,
      }
    );

    const detalles = respuestas.map((item) => ({
      respuesta_id: respuestaEncuesta.id,
      pregunta_id: item.pregunta_id,
      respuesta:
        typeof item.respuesta === 'object'
          ? JSON.stringify(item.respuesta)
          : item.respuesta,
    }));

    await EncuestaRespuestaDetalles.bulkCreate(detalles, {
      transaction,
    });

    await enlace.update(
      {
        usado: true,
        usado_en: new Date(),
        respuesta_id: respuestaEncuesta.id,
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    res.json({
      msg: 'Encuesta respondida correctamente',
    });
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    res.status(500).json({
      msg: 'Error al responder encuesta',
    });
  }
};
