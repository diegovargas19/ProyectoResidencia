import { useEffect, useMemo, useState } from 'react';
import {
  FaBell,
  FaChartLine,
  FaClipboardList,
  FaExclamationTriangle,
  FaFolderOpen,
  FaPoll,
  FaRegClock,
  FaUsers,
} from 'react-icons/fa';

import clienteAxios from '../config/clienteAxios';
import useAuth from '../hooks/useAuth';
import PageHeader from '../components/ui/PageHeader';

const formatoNumero = new Intl.NumberFormat('es-MX');

const obtenerConfig = () => {
  const token = localStorage.getItem('token');

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const formatearFecha = (fecha) => {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const alertaStyle = {
  danger: 'border-red-500/20 bg-red-500/10 text-red-300',
  warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300',
  info: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  ok: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
};

const Dashboard = () => {
  const { auth } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const obtenerDashboard = async () => {
      try {
        setLoading(true);
        setError(false);

        const { data } = await clienteAxios.get(
          '/dashboard',
          obtenerConfig()
        );

        setDashboard(data);
      } catch (err) {
        console.log(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    obtenerDashboard();
  }, []);

  const metricas = dashboard?.metricas || {};
  const progresoProyectos = dashboard?.progresoProyectos || [];
  const encuestasDestacadas = dashboard?.encuestasDestacadas || [];
  const alertas = dashboard?.alertas || [];
  const actividadReciente = dashboard?.actividadReciente || [];
  const encuestasPorEstado =
    dashboard?.distribucion?.encuestasPorEstado || {};

  const maxRespuestasProyecto = useMemo(
    () =>
      Math.max(
        1,
        ...progresoProyectos.map((proyecto) => proyecto.respuestas)
      ),
    [progresoProyectos]
  );

  const tarjetas = [
    {
      label: 'Proyectos',
      valor: metricas.proyectosTotal || 0,
      detalle: `${metricas.proyectosActivos || 0} en seguimiento`,
      icono: FaFolderOpen,
      color: 'text-blue-400',
      fondo: 'bg-blue-500/10',
    },
    {
      label: 'Encuestas',
      valor: metricas.encuestasTotal || 0,
      detalle: `${metricas.encuestasActivas || 0} activas`,
      icono: FaClipboardList,
      color: 'text-purple-400',
      fondo: 'bg-purple-500/10',
    },
    {
      label: 'Participaciones',
      valor: metricas.respuestasTotal || 0,
      detalle: `${metricas.respuestasDetalleTotal || 0} respuestas guardadas`,
      icono: FaPoll,
      color: 'text-emerald-400',
      fondo: 'bg-emerald-500/10',
    },
    {
      label: 'Usuarios',
      valor: metricas.usuariosTotal || 0,
      detalle: `${metricas.investigadoresTotal || 0} investigadores`,
      icono: FaUsers,
      color: 'text-red-400',
      fondo: 'bg-red-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-10 text-center text-gray-400">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center text-red-200">
          No se pudo cargar la informacion del dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <PageHeader
        eyebrow="Panel operativo"
        title="Dashboard general"
        description="Vista ejecutiva de proyectos, encuestas, participacion y seguimiento administrativo."
        actions={
          <div className="rounded-2xl border border-white/10 bg-[#0b162c] px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Sesion actual
            </p>

            <p className="mt-1 font-semibold text-white">
              {auth?.nombre} {auth?.primer_apellido}
            </p>

            <p className="text-sm text-gray-400">
              Rol: {auth?.rol || 'usuario'}
            </p>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;

          return (
            <div
              key={tarjeta.label}
              className="rounded-3xl border border-white/10 bg-[#0b162c] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">
                    {tarjeta.label}
                  </p>

                  <p className="mt-3 text-3xl font-bold text-white">
                    {formatoNumero.format(tarjeta.valor)}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {tarjeta.detalle}
                  </p>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tarjeta.fondo}`}
                >
                  <Icono className={tarjeta.color} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Progreso por proyecto
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  Participacion acumulada por proyecto academico.
                </p>
              </div>

              <FaChartLine className="text-blue-400" />
            </div>

            {progresoProyectos.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#081120] p-6 text-center text-gray-500">
                Aun no hay proyectos para analizar.
              </div>
            ) : (
              <div className="space-y-5">
                {progresoProyectos.map((proyecto) => {
                  const porcentaje = Math.round(
                    (proyecto.respuestas / maxRespuestasProyecto) * 100
                  );

                  return (
                    <div key={proyecto.id}>
                      <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {proyecto.nombre}
                          </p>

                          <p className="text-xs text-gray-500">
                            {proyecto.encuestas} encuestas - Prioridad{' '}
                            {proyecto.prioridad || 'sin definir'}
                          </p>
                        </div>

                        <p className="text-sm text-gray-400">
                          {formatoNumero.format(proyecto.respuestas)}{' '}
                          participaciones
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${porcentaje}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
              <div className="mb-5 flex items-center gap-3">
                <FaClipboardList className="text-purple-400" />

                <h2 className="text-xl font-semibold">
                  Encuestas destacadas
                </h2>
              </div>

              <div className="space-y-3">
                {encuestasDestacadas.length === 0 ? (
                  <p className="rounded-2xl border border-white/5 bg-[#081120] p-5 text-sm text-gray-500">
                    No hay encuestas registradas.
                  </p>
                ) : (
                  encuestasDestacadas.map((encuesta) => (
                    <div
                      key={encuesta.id}
                      className="rounded-2xl border border-white/5 bg-[#081120] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {encuesta.titulo}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Estado: {encuesta.estado || '-'}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                          {encuesta.respuestas}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
              <div className="mb-5 flex items-center gap-3">
                <FaBell className="text-yellow-400" />

                <h2 className="text-xl font-semibold">
                  Alertas administrativas
                </h2>
              </div>

              <div className="space-y-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`rounded-2xl border p-4 ${
                      alertaStyle[alerta.severidad] || alertaStyle.info
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FaExclamationTriangle className="mt-1 shrink-0" />

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {alerta.titulo}
                          </p>

                          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                            {alerta.valor}
                          </span>
                        </div>

                        <p className="mt-1 text-sm opacity-80">
                          {alerta.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-5 flex items-center gap-3">
              <FaRegClock className="text-red-400" />

              <h2 className="text-xl font-semibold">
                Actividad reciente
              </h2>
            </div>

            <div className="space-y-5">
              {actividadReciente.length === 0 ? (
                <p className="rounded-2xl border border-white/5 bg-[#081120] p-5 text-sm text-gray-500">
                  Todavia no hay respuestas recientes.
                </p>
              ) : (
                actividadReciente.map((actividad) => (
                  <div
                    key={actividad.id}
                    className="flex gap-3 rounded-2xl border border-white/5 bg-[#081120] p-4"
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">
                        {actividad.usuario}
                      </p>

                      <p className="mt-1 text-sm text-gray-400">
                        {actividad.detalle}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {formatearFecha(actividad.fecha)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <h2 className="text-xl font-semibold">
              Estado de encuestas
            </h2>

            <div className="mt-5 space-y-3">
              {Object.entries(encuestasPorEstado).length === 0 ? (
                <p className="text-sm text-gray-500">
                  Sin encuestas registradas.
                </p>
              ) : (
                Object.entries(encuestasPorEstado).map(
                  ([estado, total]) => {
                    const porcentaje =
                      metricas.encuestasTotal > 0
                        ? Math.round(
                            (total / metricas.encuestasTotal) * 100
                          )
                        : 0;

                    return (
                      <div key={estado}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-gray-300">
                            {estado}
                          </span>

                          <span className="text-gray-500">
                            {total} ({porcentaje}%)
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{
                              width: `${porcentaje}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default Dashboard;
