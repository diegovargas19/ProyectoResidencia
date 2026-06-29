import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaArrowLeft,
  FaFolderOpen,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileArchive,
  FaFileAlt,
  FaCloudUploadAlt,
  FaClock,
  FaUser,
  FaTrash,
  FaDownload,
  FaEye,
  FaUserPlus,
} from 'react-icons/fa';
import useProyectos from '../hooks/useProyectos';
import useAuth from '../hooks/useAuth';
import useUsuarios from '../hooks/useUsuarios';

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

const obtenerIconoArchivo = (nombre) => {
  const extension = nombre?.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return <FaFilePdf className="text-lg text-red-400" />;
  }

  if (['doc', 'docx'].includes(extension)) {
    return <FaFileWord className="text-lg text-blue-400" />;
  }

  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return <FaFileExcel className="text-lg text-emerald-400" />;
  }

  if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)) {
    return <FaFileImage className="text-lg text-pink-400" />;
  }

  if (['zip', 'rar'].includes(extension)) {
    return <FaFileArchive className="text-lg text-yellow-400" />;
  }

  return <FaFileAlt className="text-lg text-gray-400" />;
};

const fechaYaPaso = (fecha) => {
  if (!fecha) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const limite = new Date(`${fecha}T00:00:00`);

  return hoy > limite;
};

const Proyecto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    obtenerProyecto,
    subirArchivos,
    eliminarArchivo,
    actualizarColaboradoresProyecto,
  } = useProyectos();

  const { auth } = useAuth();
  const { usuarios, crearUsuario } = useUsuarios();

  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [colaboradoresSeleccionados, setColaboradoresSeleccionados] =
    useState([]);
  const [nuevoColaborador, setNuevoColaborador] = useState({
    nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    email: '',
    password: '',
  });

  const cargarProyecto = async () => {
    const data = await obtenerProyecto(id);

    setProyecto(data);
    setColaboradoresSeleccionados(
      data?.colaboradores?.map((colaborador) => Number(colaborador.id)) || []
    );
    setLoading(false);
  };

  useEffect(() => {
    cargarProyecto();
  }, [id]);

  const archivosOrdenados = useMemo(() => {
    if (!proyecto?.archivos) return [];

    return [...proyecto.archivos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [proyecto]);

  const proyectoVencido = fechaYaPaso(proyecto?.fecha_limite);
  const colaboradoresDisponibles = usuarios.filter(
    (usuario) => usuario.rol === 'colaborador'
  );
  const puedeGestionarColaboradores =
    auth?.rol === 'admin' ||
    (auth?.rol === 'investigador' &&
      (Number(auth.id) === Number(proyecto?.investigador_id) ||
        proyecto?.investigadores?.some(
          (investigador) => Number(investigador.id) === Number(auth.id)
        )));
  const limiteColaboradores =
    auth?.rol === 'investigador' ? 3 : null;
  const puedeSubirArchivos =
    ['admin', 'investigador', 'colaborador'].includes(auth?.rol) &&
    !proyectoVencido;

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubirArchivos = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    const resultado = await subirArchivos(id, files);

    if (resultado.ok) {
      Swal.fire({
        title: 'Archivos subidos',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });

      await cargarProyecto();
    } else {
      Swal.fire({
        title: resultado.msg || 'Error al subir archivos',
        icon: 'error',
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  const handleEliminarArchivo = async (archivoId) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar archivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      const response = await eliminarArchivo(archivoId);

      if (response.ok) {
        await cargarProyecto();

        Swal.fire({
          title: 'Archivo eliminado',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#0b162c',
          color: '#fff',
        });
      }
    }
  };

  const toggleColaborador = (usuarioId) => {
    setColaboradoresSeleccionados((actuales) => {
      if (actuales.includes(usuarioId)) {
        return actuales.filter((idActual) => idActual !== usuarioId);
      }

      if (
        limiteColaboradores &&
        actuales.length >= limiteColaboradores
      ) {
        Swal.fire({
          title: `Maximo ${limiteColaboradores} colaboradores`,
          icon: 'warning',
          background: '#0b162c',
          color: '#fff',
        });

        return actuales;
      }

      return [...actuales, usuarioId];
    });
  };

  const guardarColaboradores = async () => {
    const resultado = await actualizarColaboradoresProyecto(
      id,
      colaboradoresSeleccionados
    );

    if (resultado.ok) {
      setProyecto(resultado.data);

      Swal.fire({
        title: 'Colaboradores actualizados',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });

      return;
    }

    Swal.fire({
      title: resultado.msg || 'No se pudieron guardar los colaboradores',
      icon: 'error',
      background: '#0b162c',
      color: '#fff',
    });
  };

  const crearYAgregarColaborador = async () => {
    if (
      [
        nuevoColaborador.nombre,
        nuevoColaborador.primer_apellido,
        nuevoColaborador.email,
        nuevoColaborador.password,
      ].some((valor) => !valor.trim())
    ) {
      Swal.fire({
        title: 'Completa nombre, apellido, correo y contrasena',
        icon: 'warning',
        background: '#0b162c',
        color: '#fff',
      });

      return;
    }

    if (
      limiteColaboradores &&
      colaboradoresSeleccionados.length >= limiteColaboradores
    ) {
      Swal.fire({
        title: `Maximo ${limiteColaboradores} colaboradores`,
        icon: 'warning',
        background: '#0b162c',
        color: '#fff',
      });

      return;
    }

    const resultado = await crearUsuario({
      ...nuevoColaborador,
      rol: 'colaborador',
    });

    if (!resultado.ok || !resultado.usuario?.id) {
      Swal.fire({
        title: resultado.msg || 'No se pudo crear el colaborador',
        icon: 'error',
        background: '#0b162c',
        color: '#fff',
      });

      return;
    }

    setColaboradoresSeleccionados((actuales) => [
      ...actuales,
      resultado.usuario.id,
    ]);
    setNuevoColaborador({
      nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      email: '',
      password: '',
    });
  };

  const descargarArchivo = (archivo) => {
    const token = localStorage.getItem('token');

    window.open(
      `http://localhost:4000/api/archivos/descargar/${archivo.id}?token=${token}`,
      '_blank'
    );
  };

  const verArchivo = (archivo) => {
    const token = localStorage.getItem('token');

    window.open(
      `http://localhost:4000/api/archivos/ver/${archivo.id}?token=${token}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-white">Cargando proyecto...</p>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="p-6">
        <p className="text-red-400">Proyecto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1b34] transition hover:bg-[#122044]"
          >
            <FaArrowLeft className="text-sm" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-white">{proyecto.nombre_proyecto}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle[proyecto.estado]}`}
              >
                {proyecto.estado}
              </span>

              <span className={`text-sm font-semibold ${priorityStyle[proyecto.prioridad]}`}>
                Prioridad {proyecto.prioridad}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="min-w-42.5 rounded-2xl border border-white/10 bg-[#0b162c] px-5 py-4">
            <p className="text-sm text-gray-400">Archivos subidos</p>

            <h3 className="mt-1 text-2xl font-bold">{proyecto.archivos?.length || 0}</h3>
          </div>

          <div className="min-w-42.5 rounded-2xl border border-white/10 bg-[#0b162c] px-5 py-4">
            <p className="text-sm text-gray-400">Fecha límite</p>

            <h3 className="mt-1 text-lg font-semibold text-white">
              {proyecto.fecha_limite || '-'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <div className="sticky top-6 rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15">
                <FaFolderOpen className="text-blue-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold">Información</h2>

                <p className="text-sm text-gray-400">Detalles generales del proyecto</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-white/5 bg-[#0d1b34] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                  <FaUser />
                  <span>Investigadores</span>
                </div>

                {(
                  proyecto.investigadores?.length > 0
                    ? proyecto.investigadores
                    : proyecto.investigador
                      ? [proyecto.investigador]
                      : []
                ).length > 0 ? (
                  <div className="space-y-2">
                    {(proyecto.investigadores?.length > 0
                      ? proyecto.investigadores
                      : [proyecto.investigador]
                    ).map((investigador) => (
                      <p
                        key={investigador.id}
                        className="font-medium text-white"
                      >
                        {[
                          investigador.nombre,
                          investigador.primer_apellido,
                          investigador.segundo_apellido,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="font-medium text-white">
                    Sin investigadores asignados
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#0d1b34] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <FaUserPlus />
                    <span>Colaboradores</span>
                  </div>

                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                    {limiteColaboradores
                      ? `${colaboradoresSeleccionados.length}/${limiteColaboradores}`
                      : `${colaboradoresSeleccionados.length}`}
                  </span>
                </div>

                {puedeGestionarColaboradores ? (
                  <div className="space-y-3">
                    {colaboradoresDisponibles.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No hay usuarios colaboradores disponibles.
                      </p>
                    ) : (
                      colaboradoresDisponibles.map((colaborador) => {
                        const seleccionado =
                          colaboradoresSeleccionados.includes(colaborador.id);

                        return (
                          <label
                            key={colaborador.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                              seleccionado
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                : 'border-white/5 bg-[#081120] text-gray-300 hover:bg-white/5'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={seleccionado}
                              onChange={() => toggleColaborador(colaborador.id)}
                              className="h-4 w-4 accent-emerald-500"
                            />

                            <span className="min-w-0 truncate">
                              {[
                                colaborador.nombre,
                                colaborador.primer_apellido,
                                colaborador.segundo_apellido,
                              ]
                                .filter(Boolean)
                                .join(' ')}
                            </span>
                          </label>
                        );
                      })
                    )}

                    <div className="rounded-2xl border border-white/5 bg-[#081120] p-3">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Nuevo colaborador
                      </p>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={nuevoColaborador.nombre}
                          onChange={(e) =>
                            setNuevoColaborador((actual) => ({
                              ...actual,
                              nombre: e.target.value,
                            }))
                          }
                          placeholder="Nombre"
                          className="w-full rounded-xl border border-white/10 bg-[#0d1b34] px-3 py-2 text-sm text-white outline-none"
                        />

                        <input
                          type="text"
                          value={nuevoColaborador.primer_apellido}
                          onChange={(e) =>
                            setNuevoColaborador((actual) => ({
                              ...actual,
                              primer_apellido: e.target.value,
                            }))
                          }
                          placeholder="Primer apellido"
                          className="w-full rounded-xl border border-white/10 bg-[#0d1b34] px-3 py-2 text-sm text-white outline-none"
                        />

                        <input
                          type="email"
                          value={nuevoColaborador.email}
                          onChange={(e) =>
                            setNuevoColaborador((actual) => ({
                              ...actual,
                              email: e.target.value,
                            }))
                          }
                          placeholder="Correo"
                          className="w-full rounded-xl border border-white/10 bg-[#0d1b34] px-3 py-2 text-sm text-white outline-none"
                        />

                        <input
                          type="password"
                          value={nuevoColaborador.password}
                          onChange={(e) =>
                            setNuevoColaborador((actual) => ({
                              ...actual,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Contrasena"
                          className="w-full rounded-xl border border-white/10 bg-[#0d1b34] px-3 py-2 text-sm text-white outline-none"
                        />

                        <button
                          type="button"
                          onClick={crearYAgregarColaborador}
                          className="w-full rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20"
                        >
                          Crear y agregar
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={guardarColaboradores}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                    >
                      Guardar colaboradores
                    </button>
                  </div>
                ) : proyecto.colaboradores?.length > 0 ? (
                  <div className="space-y-2">
                    {proyecto.colaboradores.map((colaborador) => (
                      <p
                        key={colaborador.id}
                        className="truncate text-sm text-gray-300"
                      >
                        {[
                          colaborador.nombre,
                          colaborador.primer_apellido,
                          colaborador.segundo_apellido,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Sin colaboradores asignados.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#0d1b34] p-4">
                <p className="mb-2 text-sm text-gray-400">Departamento</p>

                <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                  {proyecto.departamento}
                </span>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#0d1b34] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                  <FaClock />
                  <span>Fecha límite</span>
                </div>

                <p className="text-white">{proyecto.fecha_limite || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Historial de Investigación</h2>

                <p className="mt-1 text-gray-400">
                  Archivos y avances subidos por los investigadores
                </p>
              </div>

              {puedeSubirArchivos && (
                <label className="flex w-fit cursor-pointer items-center gap-3 rounded-2xl bg-blue-600 px-5 py-3 font-medium transition hover:bg-blue-500">
                  <FaCloudUploadAlt />
                  Subir archivo
                  <input type="file" multiple className="hidden" onChange={handleSubirArchivos} />
                </label>
              )}
            </div>

            {proyectoVencido && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                La fecha limite del proyecto ya vencio. Ya no se pueden capturar archivos.
              </div>
            )}

            {archivosOrdenados.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                  <FaFolderOpen className="text-2xl text-gray-500" />
                </div>

                <h3 className="mb-2 text-lg font-semibold">No hay archivos todavía</h3>

                <p className="max-w-md text-gray-400">
                  Los investigadores podrán subir documentos, evidencias, reportes y archivos
                  relacionados con esta investigación.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute bottom-0 left-5.75 top-0 w-0.5 bg-white/10" />

                <div className="space-y-6">
                  {archivosOrdenados.map((archivo) => (
                    <div key={archivo.id} className="relative flex gap-5">
                      <div className="relative z-10 flex h-12 min-w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#111f3d]">
                        {obtenerIconoArchivo(archivo.nombre_original || archivo.archivo)}
                      </div>

                      <div className="flex-1 rounded-2xl border border-white/5 bg-[#0d1b34] p-5 transition hover:border-blue-500/20 hover:bg-[#102044]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="break-all font-semibold text-white">
                              {archivo.nombre_original || archivo.archivo}
                            </h3>

                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                              <FaClock className="text-xs" />

                              <span>Subido el {formatearFecha(archivo.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => verArchivo(archivo)}
                              className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
                            >
                              <FaEye />
                              Ver
                            </button>

                            <button
                              onClick={() => descargarArchivo(archivo)}
                              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm transition hover:bg-blue-500"
                            >
                              <FaDownload />
                              Descargar
                            </button>

                            {auth?.rol === 'admin' && (
                              <button
                                onClick={() => handleEliminarArchivo(archivo.id)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400 transition hover:bg-red-500/25"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proyecto;
