import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaChartBar,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaEnvelope,
  FaListUl,
  FaPoll,
  FaSearch,
  FaUserGraduate,
  FaUsers,
} from 'react-icons/fa';

import useEncuestas from '../hooks/useEncuestas';
import PageHeader from '../components/ui/PageHeader';

const RESPUESTAS_POR_PAGINA = 5;

const formatearFecha = (fecha) => {
  if (!fecha) return '-';

  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

const parsearRespuesta = (respuesta) => {
  if (!respuesta) return '';

  try {
    return JSON.parse(respuesta);
  } catch {
    return respuesta;
  }
};

const normalizarRespuesta = (respuesta) => {
  const valor = parsearRespuesta(respuesta);

  if (Array.isArray(valor)) return valor;

  if (valor === null || valor === undefined || valor === '') {
    return ['Sin respuesta'];
  }

  return [String(valor)];
};

const mostrarRespuesta = (respuesta) => {
  const valor = parsearRespuesta(respuesta);

  if (Array.isArray(valor)) {
    return valor.length > 0 ? valor.join(', ') : 'Sin respuesta';
  }

  return valor || 'Sin respuesta';
};

const EncuestaResultados = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { obtenerRespuestasEncuesta } = useEncuestas();

  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respuestaActiva, setRespuestaActiva] = useState(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [paginaParticipantes, setPaginaParticipantes] = useState(1);

  useEffect(() => {
    const cargarRespuestas = async () => {
      setLoading(true);

      const data = await obtenerRespuestasEncuesta(id);

      setRespuestas(data);
      setRespuestaActiva(data[0] || null);
      setLoading(false);
    };

    cargarRespuestas();
  }, [id, obtenerRespuestasEncuesta]);

  const preguntasResumen = useMemo(() => {
    const preguntas = new Map();

    respuestas.forEach((respuestaEncuesta) => {
      respuestaEncuesta.detalles?.forEach((detalle) => {
        const pregunta = detalle.pregunta;
        const preguntaId = pregunta?.id || detalle.pregunta_id;

        if (!preguntas.has(preguntaId)) {
          preguntas.set(preguntaId, {
            id: preguntaId,
            texto: pregunta?.pregunta || 'Pregunta sin titulo',
            tipo: pregunta?.tipo || 'texto',
            orden: pregunta?.orden || 0,
            total: 0,
            opciones: new Map(),
          });
        }

        const resumen = preguntas.get(preguntaId);
        const valores = normalizarRespuesta(detalle.respuesta);

        valores.forEach((valor) => {
          const texto = String(valor).trim() || 'Sin respuesta';

          resumen.total += 1;
          resumen.opciones.set(
            texto,
            (resumen.opciones.get(texto) || 0) + 1
          );
        });
      });
    });

    return [...preguntas.values()]
      .map((pregunta) => {
        const opciones = [...pregunta.opciones.entries()]
          .map(([texto, total]) => ({
            texto,
            total,
            porcentaje:
              pregunta.total > 0
                ? Math.round((total / pregunta.total) * 100)
                : 0,
          }))
          .sort((a, b) => b.total - a.total);

        return {
          ...pregunta,
          opciones,
          masComun: opciones[0],
        };
      })
      .sort((a, b) => a.orden - b.orden);
  }, [respuestas]);

  const totalDetalles = respuestas.reduce(
    (total, respuesta) => total + (respuesta.detalles?.length || 0),
    0
  );

  const ultimaRespuesta = respuestas[0]?.createdAt;

  const respuestasFiltradas = useMemo(() => {
    const termino = busquedaUsuario.trim().toLowerCase();

    if (!termino) return respuestas;

    return respuestas.filter((respuestaEncuesta) => {
      const usuario = respuestaEncuesta.usuario;
      const nombre = obtenerNombreParticipante(respuestaEncuesta).toLowerCase();
      const email = usuario?.email?.toLowerCase() || '';
      const rol = usuario?.rol?.toLowerCase() || '';

      return (
        nombre.includes(termino) ||
        email.includes(termino) ||
        rol.includes(termino)
      );
    });
  }, [busquedaUsuario, respuestas]);

  const totalPaginasParticipantes = Math.max(
    1,
    Math.ceil(respuestasFiltradas.length / RESPUESTAS_POR_PAGINA)
  );

  const respuestasPaginadas = useMemo(() => {
    const inicio =
      (paginaParticipantes - 1) * RESPUESTAS_POR_PAGINA;

    return respuestasFiltradas.slice(
      inicio,
      inicio + RESPUESTAS_POR_PAGINA
    );
  }, [paginaParticipantes, respuestasFiltradas]);

  useEffect(() => {
    setPaginaParticipantes(1);
  }, [busquedaUsuario]);

  useEffect(() => {
    if (paginaParticipantes > totalPaginasParticipantes) {
      setPaginaParticipantes(totalPaginasParticipantes);
    }
  }, [paginaParticipantes, totalPaginasParticipantes]);

  useEffect(() => {
    if (respuestasFiltradas.length === 0) return;

    const respuestaVisible = respuestasFiltradas.some(
      (respuesta) => respuesta.id === respuestaActiva?.id
    );

    if (!respuestaVisible) {
      setRespuestaActiva(respuestasFiltradas[0]);
    }
  }, [respuestaActiva?.id, respuestasFiltradas]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Resultados de encuesta"
        description="Consulta participantes, respuestas individuales y tendencias."
        backButton={
          <button
            type="button"
            onClick={() => navigate('/app/encuestas')}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1b34] text-white transition hover:bg-[#122044]"
          >
            <FaArrowLeft />
          </button>
        }
      />

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-10 text-center text-gray-400">
          Cargando resultados...
        </div>
      ) : respuestas.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-10 text-center">
          <FaPoll className="mx-auto text-4xl text-gray-500" />

          <h2 className="mt-4 text-xl font-semibold text-white">
            Aun no hay respuestas
          </h2>

          <p className="mt-2 text-gray-400">
            Cuando los usuarios contesten esta encuesta, los resultados
            apareceran aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
              <div className="flex items-center gap-3 text-gray-400">
                <FaUsers className="text-blue-400" />
                Participantes
              </div>

              <p className="mt-3 text-3xl font-bold text-white">
                {respuestas.length}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
              <div className="flex items-center gap-3 text-gray-400">
                <FaClipboardCheck className="text-emerald-400" />
                Respuestas registradas
              </div>

              <p className="mt-3 text-3xl font-bold text-white">
                {totalDetalles}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
              <div className="flex items-center gap-3 text-gray-400">
                <FaCalendarAlt className="text-yellow-400" />
                Ultima respuesta
              </div>

              <p className="mt-3 text-lg font-semibold text-white">
                {formatearFecha(ultimaRespuesta)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <FaChartBar className="text-blue-400" />

                  <h2 className="text-xl font-semibold text-white">
                    Respuestas mas comunes
                  </h2>
                </div>

                <div className="space-y-5">
                  {preguntasResumen.map((pregunta) => (
                    <div
                      key={pregunta.id}
                      className="rounded-2xl border border-white/5 bg-[#081120] p-5"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {pregunta.tipo}
                          </p>

                          <h3 className="mt-1 text-lg font-semibold text-white">
                            {pregunta.texto}
                          </h3>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                          Mas comun: {pregunta.masComun?.texto || '-'}
                        </span>
                      </div>

                      <div className="mt-5 space-y-3">
                        {pregunta.opciones.slice(0, 5).map((opcion) => (
                          <div key={opcion.texto}>
                            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                              <span className="text-gray-300">
                                {opcion.texto}
                              </span>

                              <span className="text-gray-500">
                                {opcion.total} ({opcion.porcentaje}%)
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{
                                  width: `${opcion.porcentaje}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <FaListUl className="text-purple-400" />

                  <h2 className="text-xl font-semibold text-white">
                    Quien contesto
                  </h2>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#081120] px-4 py-3">
                    <FaSearch className="text-gray-500" />

                    <input
                      type="text"
                      value={busquedaUsuario}
                      onChange={(e) => setBusquedaUsuario(e.target.value)}
                      placeholder="Buscar usuario..."
                      className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {respuestasFiltradas.length} de {respuestas.length}{' '}
                    participantes
                  </p>
                </div>

                <div className="space-y-3">
                  {respuestasPaginadas.length === 0 ? (
                    <div className="rounded-2xl border border-white/5 bg-[#081120] p-5 text-center text-sm text-gray-500">
                      No se encontraron participantes.
                    </div>
                  ) : (
                    respuestasPaginadas.map((respuestaEncuesta) => {
                    const activo =
                      respuestaActiva?.id === respuestaEncuesta.id;

                    return (
                      <button
                        key={respuestaEncuesta.id}
                        type="button"
                        onClick={() => setRespuestaActiva(respuestaEncuesta)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          activo
                            ? 'border-blue-500/40 bg-blue-500/10'
                            : 'border-white/5 bg-[#081120] hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15">
                            <FaUserGraduate className="text-blue-400" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {obtenerNombreParticipante(respuestaEncuesta)}
                            </p>

                            <p className="mt-1 truncate text-xs text-gray-500">
                              {formatearFecha(respuestaEncuesta.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                    })
                  )}
                </div>

                {respuestasFiltradas.length > RESPUESTAS_POR_PAGINA && (
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setPaginaParticipantes((pagina) =>
                          Math.max(1, pagina - 1)
                        )
                      }
                      disabled={paginaParticipantes === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FaChevronLeft size={13} />
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({
                        length: totalPaginasParticipantes,
                      }).map((_, index) => {
                        const pagina = index + 1;
                        const activa = pagina === paginaParticipantes;

                        return (
                          <button
                            key={pagina}
                            type="button"
                            onClick={() =>
                              setPaginaParticipantes(pagina)
                            }
                            className={`h-9 min-w-9 rounded-xl border px-3 text-sm transition ${
                              activa
                                ? 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                                : 'border-white/10 bg-[#081120] text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            {pagina}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPaginaParticipantes((pagina) =>
                          Math.min(
                            totalPaginasParticipantes,
                            pagina + 1
                          )
                        )
                      }
                      disabled={
                        paginaParticipantes === totalPaginasParticipantes
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FaChevronRight size={13} />
                    </button>
                  </div>
                )}
              </section>

              {respuestaActiva && (
                <section className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold text-white">
                      Detalle individual
                    </h2>

                    <div className="mt-3 space-y-2 text-sm text-gray-400">
                      <p>
                        {obtenerNombreParticipante(respuestaActiva)}
                      </p>

                      <p className="flex items-center gap-2">
                        <FaEnvelope />
                        {respuestaActiva.usuario?.email || 'Respuesta por enlace'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {respuestaActiva.detalles?.map((detalle) => (
                      <div
                        key={detalle.id}
                        className="rounded-2xl border border-white/5 bg-[#081120] p-4"
                      >
                        <p className="text-sm font-medium text-white">
                          {detalle.pregunta?.pregunta ||
                            'Pregunta sin titulo'}
                        </p>

                        <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-gray-300">
                          {mostrarRespuesta(detalle.respuesta)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
};

export default EncuestaResultados;
