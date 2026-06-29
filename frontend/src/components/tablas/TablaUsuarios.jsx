import Swal from 'sweetalert2';

import {
  FaEdit,
  FaTrash,
} from 'react-icons/fa';

import useUsuarios from '../../hooks/useUsuarios';

const roleStyles = {
  admin: 'bg-red-500/15 text-red-400 border-red-500/20',
  investigador: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  visor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const TablaUsuarios = ({
  data = [],
  setModalOpen,
}) => {
  const {
    eliminarUsuario,
    setUsuarioEditar,
  } = useUsuarios();

  const handleEditar = (
    usuario
  ) => {
    setUsuarioEditar(usuario);

    setModalOpen(true);
  };

  const handleEliminar = async (
    id
  ) => {
    const resultado =
      await Swal.fire({
        title:
          '¿Eliminar usuario?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor:
          '#dc2626',
        cancelButtonColor:
          '#334155',
        confirmButtonText:
          'Sí, eliminar',
        cancelButtonText:
          'Cancelar',
        background: '#0b162c',
        color: '#fff',
      });

    if (resultado.isConfirmed) {
      await eliminarUsuario(id);

      Swal.fire({
        title:
          'Usuario eliminado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-white/10 text-gray-500">
          <tr className="text-left">
            <th className="px-4 pb-4 font-medium">
              Usuario
            </th>

            <th className="px-4 pb-4 font-medium">
              Correo
            </th>

            <th className="px-4 pb-4 font-medium">
              Rol
            </th>

            <th className="px-4 pb-4 text-center font-medium">
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-14 text-center text-gray-500"
              >
                No hay usuarios registrados.
              </td>
            </tr>
          ) : (
            data.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b border-white/5 transition hover:bg-white/2"
              >
                {/* Usuario */}
                <td className="px-4 py-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-red-500/20 to-red-700/20 text-lg font-bold text-white">
                      {usuario.nombre?.charAt(
                        0
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <p className="font-semibold text-white">
                        {
                          usuario.nombre
                        }{' '}
                        {
                          usuario.primer_apellido
                        }
                      </p>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4">
                  <div>
                    <p className="text-gray-300">
                      {usuario.email}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Usuario activo
                    </p>
                  </div>
                </td>

                {/* Rol */}
                <td className="px-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
                      roleStyles[
                        usuario.rol
                      ]
                    }`}
                  >
                    {usuario.rol}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleEditar(
                          usuario
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 transition hover:bg-yellow-500/20"
                    >
                      <FaEdit size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleEliminar(
                          usuario.id
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TablaUsuarios;
