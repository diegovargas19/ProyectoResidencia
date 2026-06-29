import Proyectos from '../models/Proyectos.js';
import ProyectoArchivos from '../models/ProyectoArchivos.js';
import ProyectoUsuarios from '../models/ProyectoUsuarios.js';
import Usuarios from '../models/Usuarios.js';
import { Op } from 'sequelize';

const MAX_COLABORADORES_PROYECTO = 3;

const normalizarIds = (ids = []) =>
  [...new Set(ids.map((id) => Number(id)).filter(Boolean))];

const validarUsuariosPorRol = async (usuarioIds, rol) => {
  if (usuarioIds.length === 0) {
    return {
      usuarios: [],
    };
  }

  const usuarios = await Usuarios.findAll({
    where: {
      id: usuarioIds,
      rol,
    },
    attributes: ['id'],
  });

  if (usuarios.length !== usuarioIds.length) {
    return {
      error: `Todos los usuarios seleccionados deben tener rol ${rol}`,
    };
  }

  return {
    usuarios,
  };
};

const validarInvestigadores = (investigadorIds) =>
  validarUsuariosPorRol(investigadorIds, 'investigador');

const validarColaboradores = async (
  colaboradorIds,
  { aplicarLimite = false } = {}
) => {
  if (
    aplicarLimite &&
    colaboradorIds.length > MAX_COLABORADORES_PROYECTO
  ) {
    return {
      error: `Solo puedes asignar hasta ${MAX_COLABORADORES_PROYECTO} colaboradores`,
    };
  }

  return validarUsuariosPorRol(colaboradorIds, 'colaborador');
};

const sincronizarUsuariosProyecto = async (
  proyectoId,
  usuarioIds = [],
  rolProyecto
) => {
  await ProyectoUsuarios.destroy({
    where: {
      proyecto_id: proyectoId,
      rol_proyecto: rolProyecto,
    },
  });

  if (usuarioIds.length === 0) return;

  await ProyectoUsuarios.bulkCreate(
    usuarioIds.map((usuarioId) => ({
      proyecto_id: proyectoId,
      usuario_id: usuarioId,
      rol_proyecto: rolProyecto,
    }))
  );
};

const sincronizarInvestigadores = (proyectoId, investigadorIds = []) =>
  sincronizarUsuariosProyecto(proyectoId, investigadorIds, 'investigador');

const sincronizarColaboradores = (proyectoId, colaboradorIds = []) =>
  sincronizarUsuariosProyecto(proyectoId, colaboradorIds, 'colaborador');

export const usuarioPuedeAccederProyecto = async (usuario, proyectoId) => {
  if (usuario.rol === 'admin') return true;

  const proyecto = await Proyectos.findByPk(proyectoId, {
    attributes: ['id', 'investigador_id'],
  });

  if (!proyecto) return false;

  if (
    usuario.rol === 'investigador' &&
    Number(proyecto.investigador_id) === Number(usuario.id)
  ) {
    return true;
  }

  const asignacion = await ProyectoUsuarios.findOne({
    where: {
      proyecto_id: proyectoId,
      usuario_id: usuario.id,
    },
  });

  return Boolean(asignacion);
};

const adjuntarInvestigadores = async (proyectos) => {
  const proyectosJson = proyectos.map((proyecto) =>
    proyecto.toJSON()
  );

  const investigadorIds = [
    ...new Set(
      proyectosJson
        .map((proyecto) => proyecto.investigador_id)
        .filter(Boolean)
    ),
  ];

  const investigadoresLegacy = await Usuarios.findAll({
    where: {
      id: investigadorIds,
    },
    attributes: [
      'id',
      'nombre',
      'primer_apellido',
      'segundo_apellido',
      'email',
      'rol',
    ],
  });

  const investigadoresMap = new Map(
    investigadoresLegacy.map((investigador) => [
      investigador.id,
      investigador.toJSON(),
    ])
  );

  const proyectoIds = proyectosJson.map((proyecto) => proyecto.id);
  const asignaciones = await ProyectoUsuarios.findAll({
    where: {
      proyecto_id: proyectoIds,
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
  });

  const equipoPorProyecto = asignaciones.reduce(
    (acc, asignacion) => {
      const item = asignacion.toJSON();

      if (!acc[item.proyecto_id]) {
        acc[item.proyecto_id] = {
          investigadores: [],
          colaboradores: [],
        };
      }

      if (item.usuario) {
        const key =
          item.rol_proyecto === 'investigador'
            ? 'investigadores'
            : 'colaboradores';

        acc[item.proyecto_id][key].push(item.usuario);
      }

      return acc;
    },
    {}
  );

  return proyectosJson.map((proyecto) => ({
    ...proyecto,
    investigador:
      investigadoresMap.get(proyecto.investigador_id) || null,
    investigadores:
      equipoPorProyecto[proyecto.id]?.investigadores ||
      (investigadoresMap.get(proyecto.investigador_id)
        ? [investigadoresMap.get(proyecto.investigador_id)]
        : []),
    colaboradores: equipoPorProyecto[proyecto.id]?.colaboradores || [],
  }));
};

// Crear proyecto
export const crearProyecto = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { nombre_proyecto, investigador_id, departamento, estado, prioridad, fecha_limite } = req.body;
    const investigadorIds = normalizarIds(
      req.body.investigador_ids?.length
        ? req.body.investigador_ids
        : [investigador_id]
    );
    const colaboradorIds = normalizarIds(req.body.colaborador_ids);
    const nombreProyecto = nombre_proyecto?.trim();

    if (!nombreProyecto) {
      return res.status(400).json({
        msg: 'El nombre del proyecto es obligatorio',
      });
    }

    const proyectoExistente = await Proyectos.findOne({
      where: {
        nombre_proyecto: nombreProyecto,
      },
    });

    if (proyectoExistente) {
      return res.status(409).json({
        msg: 'Ya existe un proyecto con ese nombre',
      });
    }

    const validacionInvestigadores =
      await validarInvestigadores(investigadorIds);

    if (validacionInvestigadores.error) {
      return res.status(400).json({
        msg: validacionInvestigadores.error,
      });
    }

    const validacionColaboradores =
      await validarColaboradores(colaboradorIds);

    if (validacionColaboradores.error) {
      return res.status(400).json({
        msg: validacionColaboradores.error,
      });
    }

    const proyecto = await Proyectos.create({
      nombre_proyecto: nombreProyecto,
      investigador_id: investigadorIds[0] || null,
      departamento,
      estado,
      prioridad,
      fecha_limite,
    });

    await sincronizarInvestigadores(proyecto.id, investigadorIds);
    await sincronizarColaboradores(proyecto.id, colaboradorIds);

    const [proyectoCompleto] = await adjuntarInvestigadores([proyecto]);

    res.json(proyectoCompleto);
  } catch (error) {
    console.log(error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        msg: 'Ya existe un proyecto con ese nombre',
      });
    }

    res.status(500).json({
      msg: 'Error al crear proyecto',
    });
  }
};

// Obtener todos los activos (Oculta los de la papelera)
export const obtenerProyectos = async (req, res) => {
  try {
    let where = { eliminado: false };

    if (req.usuario.rol !== 'admin') {
      const asignaciones = await ProyectoUsuarios.findAll({
        where: {
          usuario_id: req.usuario.id,
        },
        attributes: ['proyecto_id'],
      });
      const proyectoIdsAsignados = asignaciones.map(
        (asignacion) => asignacion.proyecto_id
      );

      where = {
        eliminado: false,
        [Op.or]: [
          {
            investigador_id: req.usuario.id,
          },
          {
            id: proyectoIdsAsignados,
          },
        ],
      };
    }

    const proyectos = await Proyectos.findAll({
      where,
      include: [
        {
          model: ProyectoArchivos,
          as: 'archivos',
        },
      ],
    });

    res.json(await adjuntarInvestigadores(proyectos));
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener proyectos',
    });
  }
};

// Obtener uno
export const obtenerProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    const puedeAcceder = await usuarioPuedeAccederProyecto(req.usuario, id);

    if (!puedeAcceder) {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const proyecto = await Proyectos.findByPk(id, {
      include: [
        {
          model: ProyectoArchivos,
          as: 'archivos',
        },
      ],
    });

    if (!proyecto) {
      return res.status(404).json({
        msg: 'Proyecto no encontrado',
      });
    }

    const [proyectoConInvestigador] =
      await adjuntarInvestigadores([proyecto]);

    res.json(proyectoConInvestigador);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener proyecto',
    });
  }
};

// Actualizar proyecto
export const actualizarProyecto = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
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

    const { nombre_proyecto, investigador_id, departamento, estado, prioridad, fecha_limite } = req.body;
    const investigadorIds = normalizarIds(
      req.body.investigador_ids?.length
        ? req.body.investigador_ids
        : [investigador_id]
    );
    const colaboradorIds = normalizarIds(req.body.colaborador_ids);
    const nombreProyecto = nombre_proyecto?.trim();

    if (!nombreProyecto) {
      return res.status(400).json({
        msg: 'El nombre del proyecto es obligatorio',
      });
    }

    const proyectoExistente = await Proyectos.findOne({
      where: {
        nombre_proyecto: nombreProyecto,
        id: {
          [Op.ne]: id,
        },
      },
    });

    if (proyectoExistente) {
      return res.status(409).json({
        msg: 'Ya existe un proyecto con ese nombre',
      });
    }

    const validacionInvestigadores =
      await validarInvestigadores(investigadorIds);

    if (validacionInvestigadores.error) {
      return res.status(400).json({
        msg: validacionInvestigadores.error,
      });
    }

    const validacionColaboradores =
      await validarColaboradores(colaboradorIds);

    if (validacionColaboradores.error) {
      return res.status(400).json({
        msg: validacionColaboradores.error,
      });
    }

    await proyecto.update({
      nombre_proyecto: nombreProyecto,
      investigador_id: investigadorIds[0] || null,
      departamento,
      estado,
      prioridad,
      fecha_limite,
    });

    await sincronizarInvestigadores(proyecto.id, investigadorIds);
    await sincronizarColaboradores(proyecto.id, colaboradorIds);

    await proyecto.reload();

    const [proyectoCompleto] = await adjuntarInvestigadores([proyecto]);

    res.json(proyectoCompleto);
  } catch (error) {
    console.log(error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        msg: 'Ya existe un proyecto con ese nombre',
      });
    }

    res.status(500).json({
      msg: 'Error al actualizar proyecto',
    });
  }
};

// Hace Borrado Lógico (Mover a la papelera)
export const eliminarProyecto = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
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

    await proyecto.update({ eliminado: true });

    res.json({
      msg: 'Proyecto movido a la papelera de reciclaje',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al enviar proyecto a la papelera',
    });
  }
};

// Obtener los proyectos de la Papelera
export const obtenerProyectosEliminados = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const proyectos = await Proyectos.findAll({
      where: { eliminado: true },
      include: [
        {
          model: ProyectoArchivos,
          as: 'archivos',
        },
      ],
    });

    res.json(await adjuntarInvestigadores(proyectos));
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al obtener la papelera' });
  }
};

// Restaurar proyecto de la papelera a activos
export const restaurarProyecto = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const { id } = req.params;
    const proyecto = await Proyectos.findByPk(id);

    if (!proyecto) {
      return res.status(404).json({ msg: 'Proyecto no encontrado' });
    }

    await proyecto.update({ eliminado: false });

    res.json({ msg: 'Proyecto restaurado exitosamente' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: 'Error al restaurar el proyecto' });
  }
};

export const actualizarColaboradoresProyecto = async (req, res) => {
  try {
    const { id } = req.params;

    const proyecto = await Proyectos.findByPk(id);

    if (!proyecto) {
      return res.status(404).json({
        msg: 'Proyecto no encontrado',
      });
    }

    const esInvestigadorResponsable =
      req.usuario.rol === 'investigador' &&
      Number(proyecto.investigador_id) === Number(req.usuario.id);
    const esInvestigadorAsignado =
      req.usuario.rol === 'investigador' &&
      Boolean(
        await ProyectoUsuarios.findOne({
          where: {
            proyecto_id: id,
            usuario_id: req.usuario.id,
            rol_proyecto: 'investigador',
          },
        })
      );

    if (
      req.usuario.rol !== 'admin' &&
      !esInvestigadorResponsable &&
      !esInvestigadorAsignado
    ) {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const colaboradorIds = normalizarIds(req.body.colaborador_ids);
    const validacionColaboradores =
      await validarColaboradores(colaboradorIds, {
        aplicarLimite: req.usuario.rol === 'investigador',
      });

    if (validacionColaboradores.error) {
      return res.status(400).json({
        msg: validacionColaboradores.error,
      });
    }

    await sincronizarColaboradores(id, colaboradorIds);

    const proyectoActualizado = await Proyectos.findByPk(id, {
      include: [
        {
          model: ProyectoArchivos,
          as: 'archivos',
        },
      ],
    });
    const [proyectoCompleto] =
      await adjuntarInvestigadores([proyectoActualizado]);

    res.json(proyectoCompleto);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al actualizar colaboradores',
    });
  }
};

// ==========================================
// NUEVA FUNCIÓN: ELIMINAR PERMANENTEMENTE (BORRADO FÍSICO)
// ==========================================
export const eliminarProyectoPermanente = async (req, res) => {
  try {
    // 1. Validar que solo el administrador pueda purgar datos de la base de datos
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ msg: 'No autorizado' });
    }

    const { id } = req.params;

    // 2. Buscar el proyecto directamente en la base de datos
    const proyecto = await Proyectos.findByPk(id);

    if (!proyecto) {
      return res.status(404).json({ msg: 'Proyecto no encontrado' });
    }

    // 3. Ejecutar la destrucción física permanente de las relaciones y del proyecto
    // (Sequelize se encarga de cascadas si están configuradas, pero es una buena práctica limpiar explícitamente)
    await ProyectoUsuarios.destroy({ where: { proyecto_id: id } });
    await ProyectoArchivos.destroy({ where: { proyecto_id: id } });
    
    // Destrucción final del objeto
    await proyecto.destroy();

    res.json({
      msg: 'Proyecto eliminado permanentemente de la base de datos',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: 'Error al eliminar permanentemente el proyecto',
    });
  }
};