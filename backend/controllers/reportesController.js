import { Op } from 'sequelize';

import Encuestas from '../models/Encuentas.js';
import EncuestaPreguntas from '../models/EncuestasPreguntas.js';
import EncuestaRespuestaDetalles from '../models/EncuestaRespuestaDetalles.js';
import EncuestaRespuestas from '../models/EncuestaRespuestas.js';
import Proyectos from '../models/Proyectos.js';
import Usuarios from '../models/Usuarios.js';

const parsearRespuesta = (respuesta) => {
  if (!respuesta) return ['Sin respuesta'];

  try {
    const valor = JSON.parse(respuesta);

    if (Array.isArray(valor)) {
      return valor.length > 0 ? valor : ['Sin respuesta'];
    }

    return [String(valor || 'Sin respuesta')];
  } catch {
    return [String(respuesta || 'Sin respuesta')];
  }
};

const parsearOpciones = (opciones) => {
  if (!opciones) return [];

  if (Array.isArray(opciones)) return opciones;

  try {
    const valor = JSON.parse(opciones);
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
};

const obtenerNombreParticipante = (respuesta) => {
  if (respuesta?.nombre_participante) {
    return respuesta.nombre_participante;
  }

  const usuario = respuesta?.usuario;

  if (!usuario) return 'Usuario no disponible';

  return [
    usuario.nombre,
    usuario.primer_apellido,
    usuario.segundo_apellido,
  ]
    .filter(Boolean)
    .join(' ');
};

export const obtenerReportes = async (req, res) => {
  try {
    const { proyectoId } = req.query;

    const whereEncuestas = {};

    if (proyectoId && proyectoId !== 'todos') {
      whereEncuestas.proyecto_id = proyectoId;
    }

    const [proyectos, encuestas] = await Promise.all([
      Proyectos.findAll({
        raw: true,
        order: [['nombre_proyecto', 'ASC']],
      }),
      Encuestas.findAll({
        where: whereEncuestas,
        raw: true,
        order: [['createdAt', 'DESC']],
      }),
    ]);

    const encuestaIds = encuestas.map((encuesta) => encuesta.id);

    const [respuestas, preguntas, detalles] =
      encuestaIds.length > 0
        ? await Promise.all([
            EncuestaRespuestas.findAll({
              where: {
                encuesta_id: {
                  [Op.in]: encuestaIds,
                },
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
              ],
              order: [['createdAt', 'DESC']],
            }),
            EncuestaPreguntas.findAll({
              where: {
                encuesta_id: {
                  [Op.in]: encuestaIds,
                },
              },
              raw: true,
              order: [['orden', 'ASC']],
            }),
            EncuestaRespuestaDetalles.findAll({
              include: [
                {
                  model: EncuestaPreguntas,
                  as: 'pregunta',
                  attributes: [
                    'id',
                    'encuesta_id',
                    'pregunta',
                    'tipo',
                    'orden',
                  ],
                },
              ],
            }),
          ])
        : [[], [], []];

    const respuestaIds = new Set(
      respuestas.map((respuesta) => respuesta.id)
    );

    const detallesFiltrados = detalles
      .map((detalle) => detalle.toJSON())
      .filter((detalle) => respuestaIds.has(detalle.respuesta_id));

    const respuestasPorEncuesta = respuestas.reduce(
      (acc, respuesta) => {
        acc[respuesta.encuesta_id] =
          (acc[respuesta.encuesta_id] || 0) + 1;
        return acc;
      },
      {}
    );

    const preguntasPorEncuesta = preguntas.reduce(
      (acc, pregunta) => {
        acc[pregunta.encuesta_id] =
          (acc[pregunta.encuesta_id] || 0) + 1;
        return acc;
      },
      {}
    );

    const encuestasResumen = encuestas.map((encuesta) => ({
      id: encuesta.id,
      titulo: encuesta.titulo,
      estado: encuesta.estado,
      proyecto_id: encuesta.proyecto_id,
      preguntas: preguntasPorEncuesta[encuesta.id] || 0,
      respuestas: respuestasPorEncuesta[encuesta.id] || 0,
      creada: encuesta.createdAt,
    }));

    const respuestasPorDia = respuestas.reduce((acc, respuesta) => {
      const fecha = respuesta.createdAt
        ? respuesta.createdAt.toISOString().split('T')[0]
        : 'Sin fecha';

      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {});

    const participacionTemporal = Object.entries(respuestasPorDia)
      .map(([fecha, total]) => ({
        fecha,
        total,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const resumenPreguntasMap = new Map();
    const encuestasMap = new Map(
      encuestas.map((encuesta) => [encuesta.id, encuesta])
    );

    preguntas.forEach((pregunta) => {
      const encuesta = encuestasMap.get(pregunta.encuesta_id);

      resumenPreguntasMap.set(pregunta.id, {
        id: pregunta.id,
        encuesta_id: pregunta.encuesta_id,
        encuesta: encuesta?.titulo || 'Encuesta no disponible',
        pregunta: pregunta.pregunta || `Pregunta #${pregunta.id}`,
        tipo: pregunta.tipo || 'texto',
        orden: pregunta.orden || 0,
        total: 0,
        opciones: new Map(),
      });

      parsearOpciones(pregunta.opciones).forEach((opcion) => {
        const texto = String(opcion).trim();

        if (texto) {
          resumenPreguntasMap.get(pregunta.id).opciones.set(texto, 0);
        }
      });
    });

    detallesFiltrados.forEach((detalle) => {
      const pregunta = detalle.pregunta;
      const preguntaId = pregunta?.id || detalle.pregunta_id;

      if (!resumenPreguntasMap.has(preguntaId)) {
        resumenPreguntasMap.set(preguntaId, {
          id: preguntaId,
          encuesta_id: pregunta?.encuesta_id,
          encuesta:
            encuestasMap.get(pregunta?.encuesta_id)?.titulo ||
            'Encuesta no disponible',
          pregunta: pregunta?.pregunta || `Pregunta #${preguntaId}`,
          tipo: pregunta?.tipo || 'texto',
          orden: pregunta?.orden || 0,
          total: 0,
          opciones: new Map(),
        });
      }

      const resumen = resumenPreguntasMap.get(preguntaId);

      parsearRespuesta(detalle.respuesta).forEach((valor) => {
        const texto = String(valor).trim() || 'Sin respuesta';

        resumen.total += 1;
        resumen.opciones.set(
          texto,
          (resumen.opciones.get(texto) || 0) + 1
        );
      });
    });

    const resumenPreguntas = [...resumenPreguntasMap.values()]
      .map((pregunta) => {
        const opciones = [...pregunta.opciones.entries()]
          .map(([respuesta, total]) => ({
            respuesta,
            total,
            porcentaje:
              pregunta.total > 0
                ? Math.round((total / pregunta.total) * 100)
                : 0,
          }))
          .sort((a, b) => b.total - a.total);

        return {
          id: pregunta.id,
          encuesta_id: pregunta.encuesta_id,
          encuesta: pregunta.encuesta,
          pregunta: pregunta.pregunta,
          tipo: pregunta.tipo,
          orden: pregunta.orden,
          total: pregunta.total,
          masComun: opciones[0] || null,
          opciones,
        };
      })
      .sort((a, b) => {
        const encuestaA = a.encuesta || '';
        const encuestaB = b.encuesta || '';

        if (encuestaA !== encuestaB) {
          return encuestaA.localeCompare(encuestaB);
        }

        return a.orden - b.orden;
      });

    const participantes = respuestas.slice(0, 20).map((respuesta) => {
      const json = respuesta.toJSON();

      return {
        id: json.id,
        encuesta_id: json.encuesta_id,
        usuario: obtenerNombreParticipante(json),
        email: json.usuario?.email || '',
        rol: json.usuario?.rol || 'Enlace',
        fecha: json.createdAt,
      };
    });

    const totalPreguntas = preguntas.length;
    const totalRespuestas = respuestas.length;

    res.json({
      filtros: {
        proyectoId: proyectoId || 'todos',
      },
      proyectos,
      metricas: {
        proyectos: proyectoId && proyectoId !== 'todos' ? 1 : proyectos.length,
        encuestas: encuestas.length,
        preguntas: totalPreguntas,
        respuestas: totalRespuestas,
        promedioRespuestasPorEncuesta:
          encuestas.length > 0
            ? Number((totalRespuestas / encuestas.length).toFixed(1))
            : 0,
      },
      encuestasResumen,
      participacionTemporal,
      resumenPreguntas,
      participantes,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener reportes',
    });
  }
};
