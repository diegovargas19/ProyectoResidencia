import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaUserGraduate,
} from 'react-icons/fa';

import useProyectos from '../../hooks/useProyectos';
import useAuth from '../../hooks/useAuth';

const PAGE_SIZE = 10;

const statusStyle = {
  Pendiente: 'bg-yellow-500/20 text-yellow-400',
  'En progreso': 'bg-blue-500/20 text-blue-400',
  Completado: 'bg-emerald-500/20 text-emerald-400',
  Cancelado: 'bg-red-500/20 text-red-400',
};

const priorityStyle = {
  Alta: 'text-red-400',
  Media: 'text-yellow-400',
  Baja: 'text-green-400',
};

const TablaProyectos = ({
  data = [],
  search = '',
  setModalOpen,
}) => {

  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  const {
    eliminarProyecto,
    setProyectoEditar,
  } = useProyectos();

  const { auth } = useAuth();

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return data;

    return data.filter((item) =>
      [
        item.nombre_proyecto,
        item.departamento,
        item.estado,
        item.prioridad,
        item.fecha_limite,
        item.investigador_id,
        ...(item.investigadores || []).flatMap((investigador) => [
          investigador.nombre,
          investigador.primer_apellido,
          investigador.segundo_apellido,
          investigador.email,
        ]),
        item.investigador?.nombre,
        item.investigador?.primer_apellido,
        item.investigador?.segundo_apellido,
        item.investigador?.email,
        ...(item.colaboradores || []).flatMap((colaborador) => [
          colaborador.nombre,
          colaborador.primer_apellido,
          colaborador.segundo_apellido,
          colaborador.email,
        ]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [data, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredData.length / PAGE_SIZE)
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const endIndex = Math.min(
    startIndex + PAGE_SIZE,
    filteredData.length
  );

  const pageData = filteredData.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const goPrev = () => {
    setCurrentPage((p) =>
      Math.max(1, p - 1)
    );
  };

  const goNext = () => {
    setCurrentPage((p) =>
      Math.min(totalPages, p + 1)
    );
  };

  const handleEliminar = async (id) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar proyecto?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      await eliminarProyecto(id);

      Swal.fire({
        title: 'Proyecto eliminado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  const handleEditar = (proyecto) => {
    setProyectoEditar(proyecto);

    setModalOpen(true);
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-gray-500">
            <tr className="text-left">
              <th className="px-4 pb-4 font-medium">
                Proyecto
              </th>

              <th className="px-4 pb-4 font-medium">
                Investigador
              </th>

              <th className="px-4 pb-4 font-medium">
                Colaboradores
              </th>

              <th className="px-4 pb-4 font-medium">
                Departamento
              </th>

              <th className="px-4 pb-4 font-medium">
                Estado
              </th>

              <th className="px-4 pb-4 font-medium">
                Prioridad
              </th>

              <th className="px-4 pb-4 font-medium">
                Fecha límite
              </th>

              <th className="px-4 pb-4 text-center font-medium">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-gray-500"
                >
                  No se encontraron proyectos.
                </td>
              </tr>
            ) : (
              pageData.map((item) => {
                const investigadores =
                  item.investigadores?.length > 0
                    ? item.investigadores
                    : item.investigador
                      ? [item.investigador]
                      : [];

                return (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 transition hover:bg-white/2"
                  >
                    {/* Proyecto */}
                    <td className="px-4 py-5">
                      <p className="font-semibold text-white">
                        {item.nombre_proyecto}
                      </p>
                    </td>

                    {/* Investigador */}
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                          <FaUserGraduate size={15} />
                        </div>

                        <div>
                          {investigadores.length > 0 ? (
                            <>
                              <p className="text-gray-300">
                                {[
                                  investigadores[0].nombre,
                                  investigadores[0].primer_apellido,
                                  investigadores[0].segundo_apellido,
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {investigadores.length > 1
                                  ? `+${investigadores.length - 1} investigadores`
                                  : investigadores[0].email || 'Responsable'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-300">
                                Sin investigador
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Responsable
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Departamento */}
                    <td className="px-4 py-5">
                      <div className="flex flex-wrap gap-2">
                        {item.colaboradores?.length > 0 ? (
                          item.colaboradores.map((colaborador) => (
                            <span
                              key={colaborador.id}
                              className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                            >
                              {[
                                colaborador.nombre,
                                colaborador.primer_apellido,
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">
                            Sin colaboradores
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Departamento */}
                    <td className="px-4">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                        {item.departamento ||
                          '-'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          statusStyle[
                            item.estado
                          ] ??
                          'bg-white/10 text-gray-300'
                        }`}
                      >
                        {item.estado || '-'}
                      </span>
                    </td>

                    {/* Prioridad */}
                    <td
                      className={`px-4 font-medium ${
                        priorityStyle[
                          item.prioridad
                        ] ?? 'text-gray-300'
                      }`}
                    >
                      {item.prioridad || '-'}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 text-gray-400">
                      {item.fecha_limite || '-'}
                    </td>

                    {/* Acciones */}
                    <td className="px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/app/proyectos/${item.id}`
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition hover:bg-blue-500/20"
                        >
                          <FaEye size={14} />
                        </button>

                        {auth?.rol ===
                          'admin' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleEditar(
                                  item
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
                                  item.id
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                            >
                              <FaTrash size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
        <div className="flex gap-2">
          <button
            onClick={goPrev}
            disabled={safePage === 1}
            className="rounded-xl border border-white/10 bg-[#0d1b34] px-4 py-2 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <button
            onClick={goNext}
            disabled={
              safePage === totalPages ||
              filteredData.length === 0
            }
            className="rounded-xl border border-white/10 bg-[#0d1b34] px-4 py-2 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <span>
          {filteredData.length === 0
            ? 'Mostrando 0 proyectos'
            : `Mostrando ${
                startIndex + 1
              }–${endIndex} de ${
                filteredData.length
              } proyectos (Página ${safePage} de ${totalPages})`}
        </span>
      </div>
    </>
  );
};

export default TablaProyectos;
