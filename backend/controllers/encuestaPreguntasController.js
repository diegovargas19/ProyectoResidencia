import Encuestas from '../models/Encuentas.js';
import EncuestaPreguntas from '../models/EncuestasPreguntas.js';
import { fechaYaPaso } from '../helpers/validarFechas.js';

// Obtener preguntas
export const obtenerPreguntasEncuesta = async (req, res) => {
  try {
    const { encuestaId } = req.params;

    const encuesta = await Encuestas.findByPk(encuestaId, {
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

    const preguntasFormateadas = encuesta.preguntas.map((pregunta) => ({
      ...pregunta.toJSON(),
      opciones: pregunta.opciones ? JSON.parse(pregunta.opciones) : [],
    }));

    res.json(preguntasFormateadas);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener preguntas',
    });
  }
};

// Guardar preguntas
export const guardarPreguntasEncuesta = async (req, res) => {
  try {
    const { encuestaId } = req.params;
    const { preguntas } = req.body;

    const encuesta = await Encuestas.findByPk(encuestaId);

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    if (fechaYaPaso(encuesta.fecha_fin)) {
      return res.status(403).json({
        msg: 'La fecha de captura de esta encuesta ya vencio',
      });
    }

    await EncuestaPreguntas.destroy({
      where: {
        encuesta_id: encuestaId,
      },
    });

    const preguntasPreparadas = preguntas.map((pregunta, index) => ({
      encuesta_id: encuestaId,
      pregunta: pregunta.pregunta,
      tipo: pregunta.tipo,
      obligatoria: pregunta.obligatoria,
      opciones: JSON.stringify(pregunta.opciones || []),
      orden: index + 1,
    }));

    await EncuestaPreguntas.bulkCreate(preguntasPreparadas);

    const preguntasActualizadas = await EncuestaPreguntas.findAll({
      where: {
        encuesta_id: encuestaId,
      },

      order: [['orden', 'ASC']],
    });

    const preguntasFormateadas = preguntasActualizadas.map((pregunta) => ({
      ...pregunta.toJSON(),
      opciones: pregunta.opciones ? JSON.parse(pregunta.opciones) : [],
    }));

    res.json(preguntasFormateadas);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al guardar preguntas',
    });
  }
};
