import Swal from 'sweetalert2';
import {
  FaTools,
  FaEdit,
  FaTrash,
  FaClipboardCheck,
  FaChartPie,
  FaLink,
} from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
import useEncuestas from '../../hooks/useEncuestas';

const estadoStyle = {
  Activa: 'border border-emerald-500/20 bg-emerald-500/15 text-emerald-400',
  Borrador: 'border border-yellow-500/20 bg-yellow-500/15 text-yellow-400',
  Finalizada: 'border border-red-500/20 bg-red-500/15 text-red-400',
};

const fechaYaPaso = (fecha) => {
  if (!fecha) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(`${fecha}T00:00:00`);
  return hoy > fin;
};

const fechaNoHaIniciado = (fecha) => {
  if (!fecha) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(`${fecha}T00:00:00`);
  return hoy < inicio;
};

const ActionButton = ({
  label,
  children,
  className,
  ...props
}) => {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        className={className}
        {...props}
      >
        {children}
      </button>

      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-[#081120] px-3 py-2 text-center text-xs text-gray-200 opacity-0 shadow-xl transition group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
};

const TablaEncuestas = ({
  data = [],
  navigate,
  handleEliminar,
  setModalOpen,
  handleGenerarEnlaces, // 🔗 1. Recibimos la nueva función masiva desde el componente padre
}) => {
  const { auth } = useAuth();
  const { setEncuestaEditar, obtenerEstadoRespuestaEncuesta } = useEncuestas();

  const handleResponder = async (encuesta) => {
    if (encuesta.estado !== 'Activa') {
      Swal.fire({
        title: 'Encuesta no disponible',
        text:
          encuesta.estado === 'Borrador'
            ? 'Esta encuesta aun esta en borrador.'
            : 'Esta encuesta ya fue finalizada.',
        icon: 'info',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    if (fechaNoHaIniciado(encuesta.fecha_inicio)) {
      Swal.fire({
        title: 'Encuesta no disponible',
        text: 'La encuesta aun no esta disponible para responder.',
        icon: 'info',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    if (fechaYaPaso(encuesta.fecha_fin)) {
      Swal.fire({
        title: 'Encuesta vencida',
        text: 'La fecha para responder esta encuesta ya vencio.',
        icon: 'info',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    const estado = await obtenerEstadoRespuestaEncuesta(encuesta.id);

    if (estado.respondida) {
      Swal.fire({
        title: 'Encuesta ya respondida',
        text: 'Solo puedes responder esta encuesta una vez.',
        icon: 'info',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    navigate(`/app/encuestas/responder/${encuesta.id}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-275 w-full text-sm">
        <thead className="border-b border-white/10 text-gray-500">
          <tr className="text-left">
            <th className="px-4 pb-4 font-medium">Encuesta</th>
            <th className="px-4 pb-4 font-medium">Estado</th>
            <th className="px-4 pb-4 font-medium">Fecha Inicio</th>
            <th className="px-4 pb-4 font-medium">Fecha Fin</th>
            <th className="px-4 pb-4 font-medium">Fecha Creación</th>
            <th className="px-4 pb-4 text-center font-medium">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-20 text-center text-gray-500"
              >
                No se encontraron encuestas.
              </td>
            </tr>
          ) : (
            data.map((encuesta) => (
              <tr
                key={encuesta.id}
                className="border-b border-white/5 transition hover:bg-white/2"
              >
                {/* Encuesta */}
                <td className="px-4 py-5">
                  <div>
                    <p className="font-semibold text-white">
                      {encuesta.titulo}
                    </p>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${estadoStyle[encuesta.estado]}`}
                  >
                    {encuesta.estado}
                  </span>
                </td>

                {/* Fecha Inicio */}
                <td className="px-4">
                  <span className="text-gray-300">
                    {encuesta.fecha_inicio || '-'}
                  </span>
                </td>

                {/* Fecha Fin */}
                <td className="px-4">
                  <span className="text-gray-300">
                    {encuesta.fecha_fin || '-'}
                  </span>
                </td>

                {/* Fecha Creación */}
                <td className="px-4">
                  <span className="text-gray-400">
                    {encuesta.createdAt?.split('T')[0]}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4">
                  <div className="flex items-center justify-center gap-2">
                    {auth?.rol === 'admin' && (
                      <ActionButton
                        label="Construir encuesta"
                        onClick={() =>
                          navigate(`/app/encuestas/builder/${encuesta.id}`)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition hover:bg-blue-500/20"
                      >
                        <FaTools size={14} />
                      </ActionButton>
                    )}

                    <ActionButton
                      label="Responder encuesta"
                      onClick={() => handleResponder(encuesta)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 transition hover:bg-emerald-500/20"
                    >
                      <FaClipboardCheck size={14} />
                    </ActionButton>

                    {auth?.rol === 'admin' && (
                      <ActionButton
                        label="Generar enlaces de un solo uso"
                        onClick={() => handleGenerarEnlaces(encuesta.id)} // 👈 2. Redireccionamos la acción al nuevo modal masivo
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 transition hover:bg-cyan-500/20"
                      >
                        <FaLink size={14} />
                      </ActionButton>
                    )}

                    {auth?.rol === 'admin' && (
                      <ActionButton
                        label="Editar datos"
                        onClick={() => {
                          setEncuestaEditar(encuesta);
                          setModalOpen(true);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 transition hover:bg-yellow-500/20"
                      >
                        <FaEdit size={14} />
                      </ActionButton>
                    )}

                    {auth?.rol === 'admin' && (
                      <ActionButton
                        label="Eliminar encuesta"
                        onClick={() => handleEliminar(encuesta.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                      >
                        <FaTrash size={14} />
                      </ActionButton>
                    )}

                    {auth?.rol === 'admin' && (
                      <ActionButton
                        label="Ver resultados"
                        onClick={() =>
                          navigate(`/app/encuestas/resultados/${encuesta.id}`)
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-400 transition hover:bg-purple-500/20"
                      >
                        <FaChartPie size={14} />
                      </ActionButton>
                    )}
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

export default TablaEncuestas;