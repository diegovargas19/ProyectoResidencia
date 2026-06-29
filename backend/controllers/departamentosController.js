import Departamentos from '../models/Departamentos.js';

export const obtenerDepartamentos = async (req, res) => {
  try {
    const departamentos = await Departamentos.findAll({
      order: [['nombre', 'ASC']],
    });

    res.json(departamentos);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al obtener departamentos',
    });
  }
};

export const crearDepartamento = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const nombre = req.body.nombre?.trim();

    if (!nombre) {
      return res.status(400).json({
        msg: 'El nombre del departamento es obligatorio',
      });
    }

    const existe = await Departamentos.findOne({
      where: {
        nombre,
      },
    });

    if (existe) {
      return res.status(400).json({
        msg: 'El departamento ya existe',
      });
    }

    const departamento = await Departamentos.create({
      nombre,
    });

    res.json(departamento);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al crear departamento',
    });
  }
};

export const eliminarDepartamento = async (req, res) => {
  try {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({
        msg: 'No autorizado',
      });
    }

    const { id } = req.params;

    const departamento = await Departamentos.findByPk(id);

    if (!departamento) {
      return res.status(404).json({
        msg: 'Departamento no encontrado',
      });
    }

    await departamento.destroy();

    res.json({
      msg: 'Departamento eliminado',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      msg: 'Error al eliminar departamento',
    });
  }
};
