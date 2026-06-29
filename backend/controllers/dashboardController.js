import Encuestas from '../models/Encuentas.js';
import EncuestaRespuestas from '../models/EncuestaRespuestas.js';
import EncuestaRespuestaDetalles from '../models/EncuestaRespuestaDetalles.js';
import Proyectos from '../models/Proyectos.js';
import Usuarios from '../models/Usuarios.js';

const normalizar = (valor) =>
  String(valor || '').trim().toLowerCase();

const contarPor = (items, campo) =>
  items.reduce((acc, item) => {
    const clave = item[campo] || 'Sin estado';
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});

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

export const obtenerDashboard = async (req, res) => {
  try {
    const [
      proyectosRaw,
      encuestasRaw,
      respuestasRaw,
      totalDetalles,
      totalUsuarios,
      totalInvestigadores,
      respuestasRecientes,
    ] = await Promise.all([
      Proyectos.findAll({
        raw: true,
      }),
      Encuestas.findAll({
        raw: true,
        order: [['createdAt', 'DESC']],
      }),
      EncuestaRespuestas.findAll({
        raw: true,
      }),
      EncuestaRespuestaDetalles.count(),
      Usuarios.count(),
      Usuarios.count({
        where: {
          rol: 'investigador',
        },
      }),
      EncuestaRespuestas.findAll({
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
        limit: 6,
      }),
    ]);

    const proyectos = proyectosRaw.map((proyecto) => ({
      ...proyecto,
      estadoNormalizado: normalizar(proyecto.estado),
    }));

    const encuestas = encuestasRaw.map((encuesta) => ({
      ...encuesta,
      estadoNormalizado: normalizar(encuesta.estado),
    }));

    const respuestasPorEncuesta = respuestasRaw.reduce(
      (acc, respuesta) => {
        acc[respuesta.encuesta_id] =
          (acc[respuesta.encuesta_id] || 0) + 1;
        return acc;
      },
      {}
    );

    const encuestasPorProyecto = encuestas.reduce(
      (acc, encuesta) => {
        acc[encuesta.proyecto_id] =
          (acc[encuesta.proyecto_id] || 0) + 1;
        return acc;
      },
      {}
    );

    const respuestasPorProyecto = encuestas.reduce(
      (acc, encuesta) => {
        acc[encuesta.proyecto_id] =
          (acc[encuesta.proyecto_id] || 0) +
          (respuestasPorEncuesta[encuesta.id] || 0);
        return acc;
      },
      {}
    );

    const proyectosActivos = proyectos.filter(
      (proyecto) => proyecto.estadoNormalizado !== 'completado'
    ).length;

    const encuestasActivas = encuestas.filter(
      (encuesta) => encuesta.estadoNormalizado === 'activa'
    ).length;

    const encuestasSinRespuestas = encuestas.filter(
      (encuesta) => (respuestasPorEncuesta[encuesta.id] || 0) === 0
    );

    const proyectosSinEncuestas = proyectos.filter(
      (proyecto) => (encuestasPorProyecto[proyecto.id] || 0) === 0
    );

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proyectosVencidos = proyectos.filter((proyecto) => {
      if (!proyecto.fecha_limite) return false;

      const fechaLimite = new Date(`${proyecto.fecha_limite}T00:00:00`);

      return (
        fechaLimite < hoy &&
        proyecto.estadoNormalizado !== 'completado'
      );
    });

    const encuestasDestacadas = encuestas
      .map((encuesta) => ({
        id: encuesta.id,
        titulo: encuesta.titulo,
        estado: encuesta.estado,
        respuestas: respuestasPorEncuesta[encuesta.id] || 0,
      }))
      .sort((a, b) => b.respuestas - a.respuestas)
      .slice(0, 5);

    const progresoProyectos = proyectos
      .map((proyecto) => ({
        id: proyecto.id,
        nombre: proyecto.nombre_proyecto,
        estado: proyecto.estado,
        prioridad: proyecto.prioridad,
        encuestas: encuestasPorProyecto[proyecto.id] || 0,
        respuestas: respuestasPorProyecto[proyecto.id] || 0,
      }))
      .sort((a, b) => b.respuestas - a.respuestas)
      .slice(0, 6);

    const encuestasPorEstado = contarPor(encuestas, 'estado');
    const proyectosPorEstado = contarPor(proyectos, 'estado');

    const encuestaMap = new Map(
      encuestas.map((encuesta) => [encuesta.id, encuesta])
    );

    const actividadReciente = respuestasRecientes.map((respuesta) => {
      const json = respuesta.toJSON();
      const encuesta = encuestaMap.get(json.encuesta_id);

      return {
        id: json.id,
        tipo: 'respuesta',
        usuario: obtenerNombreParticipante(json),
        detalle: `Respondio ${encuesta?.titulo || 'una encuesta'}`,
        fecha: json.createdAt,
      };
    });

    const alertas = [
      {
        id: 'encuestas-sin-respuestas',
        titulo: 'Encuestas sin respuestas',
        valor: encuestasSinRespuestas.length,
        descripcion:
          'Instrumentos publicados o creados que aun no registran participacion.',
        severidad:
          encuestasSinRespuestas.length > 0 ? 'warning' : 'ok',
      },
      {
        id: 'proyectos-sin-encuestas',
        titulo: 'Proyectos sin encuestas',
        valor: proyectosSinEncuestas.length,
        descripcion:
          'Proyectos que todavia no tienen instrumentos asociados.',
        severidad:
          proyectosSinEncuestas.length > 0 ? 'info' : 'ok',
      },
      {
        id: 'proyectos-vencidos',
        titulo: 'Proyectos vencidos',
        valor: proyectosVencidos.length,
        descripcion:
          'Proyectos con fecha limite vencida y estado pendiente o en proceso.',
        severidad:
          proyectosVencidos.length > 0 ? 'danger' : 'ok',
      },
    ];

    res.json({
      metricas: {
        proyectosTotal: proyectos.length,
        proyectosActivos,
        encuestasTotal: encuestas.length,
        encuestasActivas,
        respuestasTotal: respuestasRaw.length,
        respuestasDetalleTotal: totalDetalles,
        usuariosTotal: totalUsuarios,
        investigadoresTotal: totalInvestigadores,
      },
      distribucion: {
        encuestasPorEstado,
        proyectosPorEstado,
      },
      encuestasDestacadas,
      progresoProyectos,
      actividadReciente,
      alertas,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener dashboard',
    });
  }
};
