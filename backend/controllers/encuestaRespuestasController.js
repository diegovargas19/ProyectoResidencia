import Encuestas from '../models/Encuentas.js';
import EncuestaPreguntas from '../models/EncuestasPreguntas.js';
import EncuestaRespuestas from '../models/EncuestaRespuestas.js';
import EncuestaRespuestaDetalles from '../models/EncuestaRespuestaDetalles.js';
import Usuarios from '../models/Usuarios.js';
import { fechaNoHaIniciado, fechaYaPaso } from '../helpers/validarFechas.js';

// Guardar respuestas
export const responderEncuesta = async (req, res) => {
  try {
    const { encuestaId } = req.params;
    const { respuestas } = req.body;

    const encuesta = await Encuestas.findByPk(encuestaId);

    if (!encuesta) {
      return res.status(404).json({
        msg: 'Encuesta no encontrada',
      });
    }

    if (encuesta.estado !== 'Activa') {
      return res.status(403).json({
        msg: 'Esta encuesta no esta activa para recibir respuestas',
      });
    }

    if (fechaNoHaIniciado(encuesta.fecha_inicio)) {
      return res.status(403).json({
        msg: 'La encuesta aun no esta disponible',
      });
    }

    if (fechaYaPaso(encuesta.fecha_fin)) {
      return res.status(403).json({
        msg: 'La fecha para responder esta encuesta ya vencio',
      });
    }

    const respuestaExistente = await EncuestaRespuestas.findOne({
      where: {
        encuesta_id: encuestaId,
        usuario_id: req.usuario.id,
      },
    });

    if (respuestaExistente) {
      return res.status(409).json({
        msg: 'Ya respondiste esta encuesta',
      });
    }

    await EncuestaPreguntas.findAll({
      where: {
        encuesta_id: encuestaId,
      },
    });

    const respuestaEncuesta = await EncuestaRespuestas.create({
      encuesta_id: encuestaId,
      usuario_id: req.usuario.id,
    });

    const detalles = respuestas.map((item) => ({
      respuesta_id: respuestaEncuesta.id,
      pregunta_id: item.pregunta_id,
      respuesta: typeof item.respuesta === 'object' ? JSON.stringify(item.respuesta) : item.respuesta,
    }));

    await EncuestaRespuestaDetalles.bulkCreate(detalles);

    res.json({
      msg: 'Encuesta respondida correctamente',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al responder encuesta',
    });
  }
};

// Verificar si el usuario autenticado ya respondio
export const obtenerEstadoRespuestaUsuario = async (req, res) => {
  try {
    const { encuestaId } = req.params;

    const respuesta = await EncuestaRespuestas.findOne({
      where: {
        encuesta_id: encuestaId,
        usuario_id: req.usuario.id,
      },
      attributes: ['id', 'createdAt'],
    });

    res.json({
      respondida: Boolean(respuesta),
      respuesta,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al verificar respuesta',
    });
  }
};

// Obtener respuestas
export const obtenerRespuestasEncuesta = async (req, res) => {
  try {
    const { encuestaId } = req.params;

    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const respuestas = await EncuestaRespuestas.findAll({
      where: {
        encuesta_id: encuestaId,
      },

      include: [
        {
          model: Usuarios,
          as: 'usuario',
          attributes: [
            'id',
            'nombre',
            'primer_apellido',
            'segundo_apellido',
            'email',
            'rol',
          ],
        },
        {
          model: EncuestaRespuestaDetalles,
          as: 'detalles',
          include: [
            {
              model: EncuestaPreguntas,
              as: 'pregunta',
              attributes: [
                'id',
                'pregunta',
                'tipo',
                'opciones',
                'orden',
              ],
            },
          ],
        },
      ],

      order: [['createdAt', 'DESC']],
    });

    res.json(respuestas);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener respuestas',
    });
  }
};
