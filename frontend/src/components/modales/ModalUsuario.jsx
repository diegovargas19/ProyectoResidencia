import {
  useEffect,
  useState,
} from 'react';

import useUsuarios from '../../hooks/useUsuarios';

const ModalUsuario = ({
  modalOpen,
  setModalOpen,
}) => {
  const {
    crearUsuario,
    editarUsuario,
    usuarioEditar,
    setUsuarioEditar,
  } = useUsuarios();

  // Se cambia el rol inicial por defecto a 'colaborador'
  const [formulario, setFormulario] =
    useState({
      nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      email: '',
      password: '',
      rol: 'colaborador', 
    });

  useEffect(() => {
    if (usuarioEditar) {
      setFormulario({
        ...usuarioEditar,
        password: '',
      });
    }
  }, [usuarioEditar]);

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleClose = () => {
    setModalOpen(false);

    setUsuarioEditar(null);

    // Se limpia el formulario regresando el rol por defecto a 'colaborador'
    setFormulario({
      nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      email: '',
      password: '',
      rol: 'colaborador',
    });
  };

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    let respuesta;

    if (usuarioEditar) {
      respuesta =
        await editarUsuario(
          formulario
        );
    } else {
      respuesta =
        await crearUsuario(
          formulario
        );
    }

    if (respuesta.ok) {
      handleClose();
    }
  };

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0b162c] p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {usuarioEditar
              ? 'Editar Usuario'
              : 'Nuevo Usuario'}
          </h2>

          <button
            onClick={handleClose}
            className="text-2xl text-gray-400"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={formulario.nombre}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-[#091224] px-4 py-4 text-white outline-none"
          />

          <input
            type="text"
            name="primer_apellido"
            placeholder="Primer apellido"
            value={
              formulario.primer_apellido
            }
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-[#091224] px-4 py-4 text-white outline-none"
          />

          <input
            type="text"
            name="segundo_apellido"
            placeholder="Segundo apellido"
            value={
              formulario.segundo_apellido
            }
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-[#091224] px-4 py-4 text-white outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={formulario.email}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-[#091224] px-4 py-4 text-white outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={
              formulario.password
            }
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-[#091224] px-4 py-4 text-white outline-none"
          />

          <select
            name="rol"
            value={formulario.rol}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-[#091224] px-4 py-4 text-white outline-none"
          >
            {/* Se eliminó por completo la opción de 'visor' */}
            <option value="colaborador">
              Colaborador
            </option>

            <option value="investigador">
              Investigador
            </option>

            <option value="admin">
              Administrador
            </option>
          </select>

          <div className="md:col-span-2">
            <button className="w-full rounded-xl bg-red-700 py-4 font-medium text-white transition hover:bg-red-600">
              {usuarioEditar
                ? 'Guardar Cambios'
                : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalUsuario;