import { memo, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaFilePdf,
  FaFilter,
  FaPoll,
  FaQuestionCircle,
  FaUsers,
} from 'react-icons/fa';

import clienteAxios from '../config/clienteAxios';
import PageHeader from '../components/ui/PageHeader';

const formatoNumero = new Intl.NumberFormat('es-MX');
const RESPUESTAS_COMUNES_POR_PAGINA = 5;
const PREGUNTAS_DETALLE_POR_PAGINA = 2;
const PARTICIPANTES_RECIENTES_POR_PAGINA = 6;

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
    year: 'numeric',
  });
};

const limpiarHtml = (valor) =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const truncarTexto = (valor, limite = 28) => {
  const texto = String(valor ?? '');
  return texto.length > limite ? `${texto.slice(0, limite)}...` : texto;
};

// 📊 FUNCIÓN GENERADORA DEL PDF CON ESTILO GOOGLE FORMS
const construirPdfHtml = (reporte, proyectoNombre) => {
  const metricas = reporte.metricas || {};

  return `
    <html>
      <head>
        <title>Reporte de encuestas</title>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 40px; background-color: #f9fafb; }
          
          /* Encabezado Principal */
          .header { background: #ffffff; border: 1px solid #e5e7eb; border-top: 10px solid #dc2626; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
          h1 { margin: 0 0 8px 0; font-size: 28px; color: #111827; }
          .muted { color: #6b7280; font-size: 14px; margin: 4px 0; }
          
          /* Grid de Métricas Rápidas */
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
          .card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; }
          .card-title { font-size: 13px; font-weight: 600; color: #4b5563; uppercase tracking-wider; }
          .value { font-size: 28px; font-weight: 700; margin-top: 8px; color: #111827; }
          
          /* Tarjetas de Encuestas Incluidas */
          .section-title { font-size: 20px; font-weight: 600; margin: 32px 0 16px 0; color: #111827; }
          table { border-collapse: collapse; width: 100%; background: white; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 32px; }
          th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #1f2937; color: white; font-weight: 600; font-size: 14px; }
          td { font-size: 14px; }

          /* Tarjetas de Preguntas Estilo Google Forms */
          .pregunta-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; page-break-inside: avoid; }
          .pregunta-texto { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 4px; }
          .pregunta-meta { font-size: 13px; color: #6b7280; margin-bottom: 20px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
          
          /* Gráfico de Barras Verticales */
          .grafico-barras-vertical { display: flex; align-items: flex-end; justify-content: space-around; height: 220px; padding: 20px 10px 10px 10px; border-bottom: 2px solid #e5e7eb; margin-bottom: 16px; gap: 12px; }
          .columna-barra { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; height: 100%; justify-content: flex-end; }
          
          /* Relleno que crece hacia arriba */
          .barra-relleno { width: 100%; max-width: 45px; background-color: #4f46e5 !important; border-radius: 4px 4px 0 0; position: relative; min-height: 4px; display: flex; justify-content: center; }
          .barra-valor { position: absolute; top: -22px; font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap; }
          .barra-etiqueta { margin-top: 8px; font-size: 12px; color: #4b5563; text-align: center; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          
          .sin-respuestas { display: flex; align-items: center; justify-content: center; height: 100px; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; color: #6b7280; font-size: 14px; }

          /* Forzado estricto para impresión en navegadores Chromium */
          @media print {
            body { background-color: #f9fafb; margin: 20px; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .pregunta-card { border: 1px solid #e5e7eb; box-shadow: none; page-break-inside: avoid; }
            .barra-relleno { background-color: #4f46e5 !important; }
          }
        </style>
      </head>
      <body>
        
        <div class="header">
          <h1>Reporte de encuestas</h1>
          <p class="muted"><strong>Proyecto:</strong> ${limpiarHtml(proyectoNombre)}</p>
          <p class="muted"><strong>Fecha de generación:</strong> ${new Date().toLocaleString('es-MX')}</p>
        </div>

        <div class="grid">
          <div class="card"><div class="card-title">Proyectos</div><div class="value">${metricas.proyectos || 0}</div></div>
          <div class="card"><div class="card-title">Encuestas</div><div class="value">${metricas.encuestas || 0}</div></div>
          <div class="card"><div class="card-title">Preguntas</div><div class="value">${metricas.preguntas || 0}</div></div>
          <div class="card"><div class="card-title">Respuestas Totales</div><div class="value">${metricas.respuestas || 0}</div></div>
        </div>

        <h2 class="section-title">Encuestas incluidas</h2>
        <table>
          <thead>
            <tr><th>Encuesta</th><th>Estado</th><th>Preguntas</th><th>Respuestas</th></tr>
          </thead>
          <tbody>
            ${(reporte.encuestasResumen || [])
              .map(
                (encuesta) => `
                  <tr>
                    <td><strong>${limpiarHtml(encuesta.titulo)}</strong></td>
                    <td>${limpiarHtml(encuesta.estado)}</td>
                    <td>${encuesta.preguntas}</td>
                    <td>${encuesta.respuestas}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>

        <h2 class="section-title">Respuestas por pregunta</h2>
        
        ${(reporte.resumenPreguntas || [])
          .map((pregunta, index) => {
            const opciones = pregunta.opciones || [];
            const tieneRespuestas = opciones.length > 0;
            const totalVotosPregunta = opciones.reduce((acc, op) => acc + Number(op.total || 0), 0);

            return `
              <div class="pregunta-card">
                <div class="pregunta-texto">${index + 1}. ${limpiarHtml(pregunta.pregunta)}</div>
                <div class="pregunta-meta">${limpiarHtml(pregunta.encuesta)} &nbsp;•&nbsp; Tipo: ${limpiarHtml(pregunta.tipo)} &nbsp;•&nbsp; <strong>${totalVotosPregunta} respuestas</strong></div>
                
                ${tieneRespuestas ? `
                  <div class="grafico-barras-vertical">
                    ${opciones.map((opcion) => {
                      const porcentaje = Number(opcion.porcentaje || 0);
                      return `
                        <div class="columna-barra">
                          <div class="barra-relleno" style="height: ${porcentaje}%;">
                            <span class="barra-valor">${opcion.total} (${porcentaje}%)</span>
                          </div>
                          <div class="barra-etiqueta" title="${limpiarHtml(opcion.respuesta)}">
                            ${limpiarHtml(opcion.respuesta)}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : `
                  <div class="sin-respuestas">Sin respuestas acumuladas para esta pregunta</div>
                `}
              </div>
            `;
          })
          .join('')}

      </body>
    </html>
  `;
};

// 📋 COMPONENTES AUXILIARES DEL DASHBOARD INTERNO
const RespuestasComunesCard = memo(({ preguntas }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuPaginasAbierto, setMenuPaginasAbierto] = useState(false);
  const totalPaginas = Math.max(1, Math.ceil(preguntas.length / RESPUESTAS_COMUNES_POR_PAGINA));
  
  const respuestasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * RESPUESTAS_COMUNES_POR_PAGINA;
    return preguntas.slice(inicio, inicio + RESPUESTAS_COMUNES_POR_PAGINA);
  }, [paginaActual, preguntas]);

  const inicio = preguntas.length === 0 ? 0 : (paginaActual - 1) * RESPUESTAS_COMUNES_POR_PAGINA + 1;
  const fin = Math.min(paginaActual * RESPUESTAS_COMUNES_POR_PAGINA, preguntas.length);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Respuestas mas comunes</h2>
          {preguntas.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">{inicio}-{fin} de {preguntas.length} preguntas</p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {preguntas.length === 0 ? (
          <p className="rounded-2xl border border-white/5 bg-[#081120] p-5 text-sm text-gray-500">No hay respuestas para resumir.</p>
        ) : (
          respuestasPaginadas.map((pregunta) => (
            <div key={pregunta.id} className="rounded-2xl border border-white/5 bg-[#081120] p-4">
              <p className="text-sm font-medium text-white">{pregunta.pregunta}</p>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-gray-400">{pregunta.masComun?.respuesta || '-'}</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  {pregunta.masComun?.porcentaje || 0}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {preguntas.length > RESPUESTAS_COMUNES_POR_PAGINA && (
        <div className="mt-5 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaChevronLeft size={13} />
          </button>

          <div className="relative min-w-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenuPaginasAbierto(false); }}>
            <button
              type="button"
              onClick={() => setMenuPaginasAbierto((a) => !a)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm font-medium text-red-200 outline-none transition hover:bg-red-500/15"
            >
              Pagina {paginaActual} de {totalPaginas}
              <FaChevronDown size={12} className={`transition ${menuPaginasAbierto ? 'rotate-180' : ''}`} />
            </button>

            {menuPaginasAbierto && (
              <div className="absolute inset-x-0 bottom-12 z-20 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#081120] p-1 shadow-2xl">
                {Array.from({ length: totalPaginas }).map((_, index) => {
                  const pag = index + 1;
                  return (
                    <button
                      key={pag}
                      type="button"
                      onClick={() => { setPaginaActual(pag); setMenuPaginasAbierto(false); }}
                      className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm ${pag === paginaActual ? 'bg-red-500/20 text-red-200' : 'text-gray-300 hover:bg-white/5'}`}
                    >
                      Pagina {pag} de {totalPaginas}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
});
RespuestasComunesCard.displayName = 'RespuestasComunesCard';

const PreguntasGraficasCard = memo(({ preguntas }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuPaginasAbierto, setMenuPaginasAbierto] = useState(false);
  const totalPaginas = Math.max(1, Math.ceil(preguntas.length / PREGUNTAS_DETALLE_POR_PAGINA));

  const preguntasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * PREGUNTAS_DETALLE_POR_PAGINA;
    return preguntas.slice(inicio, inicio + PREGUNTAS_DETALLE_POR_PAGINA);
  }, [paginaActual, preguntas]);

  const inicio = preguntas.length === 0 ? 0 : (paginaActual - 1) * PREGUNTAS_DETALLE_POR_PAGINA + 1;
  const fin = Math.min(paginaActual * PREGUNTAS_DETALLE_POR_PAGINA, preguntas.length);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Preguntas, respuestas y graficas</h2>
        <p className="mt-1 text-sm text-gray-400">Desglose completo de cada pregunta con sus respuestas agrupadas.</p>
        {preguntas.length > 0 && (
          <p className="mt-2 text-xs text-gray-500">{inicio}-{fin} de {preguntas.length} preguntas</p>
        )}
      </div>

      {preguntas.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-[#081120] p-5 text-sm text-gray-500">No hay preguntas registradas.</p>
      ) : (
        <div className="space-y-5">
          {preguntasPaginadas.map((pregunta) => {
            const respuestas = pregunta.opciones || [];
            const respuestasConDatos = respuestas.filter((r) => r.total > 0);
            const datosGrafica = respuestasConDatos.length > 0 ? respuestasConDatos : respuestas;
            const alturaGrafica = Math.max(220, Math.min(420, datosGrafica.length * 40 + 88));

            return (
              <article key={`${pregunta.encuesta_id}-${pregunta.id}`} className="rounded-2xl border border-white/5 bg-[#081120] p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{pregunta.encuesta} - {pregunta.tipo}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{pregunta.pregunta}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-blue-300">
                      {formatoNumero.format(pregunta.total || 0)} respuestas
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                      Mas comun: {pregunta.masComun?.respuesta || '-'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {respuestas.length === 0 ? (
                      <p className="rounded-2xl border border-white/5 bg-[#0b162c] p-4 text-sm text-gray-500">Aun no hay respuestas.</p>
                    ) : (
                      respuestas.map((opcion) => (
                        <div key={opcion.respuesta} className="rounded-2xl border border-white/5 bg-[#0b162c] p-4">
                          <div className="mb-2 flex items-start justify-between gap-4 text-sm">
                            <span className="min-w-0 break-words text-gray-200">{opcion.respuesta}</span>
                            <span className="shrink-0 text-gray-500">{opcion.total} ({opcion.porcentaje}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full bg-red-500" style={{ width: `${opcion.porcentaje}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="min-h-56 rounded-2xl border border-white/5 bg-[#0b162c] p-4" style={{ height: alturaGrafica }}>
                    {datosGrafica.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-gray-500">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosGrafica} layout="vertical" margin={{ top: 8, right: 20, left: 20, bottom: 8 }}>
                          <CartesianGrid stroke="#ffffff14" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis type="category" dataKey="respuesta" width={140} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => truncarTexto(v, 20)} />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                            formatter={(val, name, props) => [`${val} respuestas (${props.payload.porcentaje}%)`, 'Total']}
                            contentStyle={{ background: '#081120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                          />
                          <Bar dataKey="total" fill="#dc2626" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {preguntas.length > PREGUNTAS_DETALLE_POR_PAGINA && (
        <div className="mt-5 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 border-t border-white/5 pt-4">
          <button type="button" onClick={() => setPaginaActual((p) => Math.max(1, p - 1))} disabled={paginaActual === 1} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 disabled:opacity-40">
            <FaChevronLeft size={13} />
          </button>

          <div className="relative min-w-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenuPaginasAbierto(false); }}>
            <button type="button" onClick={() => setMenuPaginasAbierto((a) => !a)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-200">
              Pagina {paginaActual} de {totalPaginas}
              <FaChevronDown size={12} className={`transition ${menuPaginasAbierto ? 'rotate-180' : ''}`} />
            </button>

            {menuPaginasAbierto && (
              <div className="absolute inset-x-0 bottom-12 z-20 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#081120] p-1 shadow-2xl">
                {Array.from({ length: totalPaginas }).map((_, index) => {
                  const pag = index + 1;
                  return (
                    <button key={pag} type="button" onClick={() => { setPaginaActual(pag); setMenuPaginasAbierto(false); }} className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm ${pag === paginaActual ? 'bg-red-500/20 text-red-200' : 'text-gray-300 hover:bg-white/5'}`}>
                      Pagina {pag} de {totalPaginas}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 disabled:opacity-40">
            <FaChevronRight size={13} />
          </button>
        </div>
      )}
    </section>
  );
});
PreguntasGraficasCard.displayName = 'PreguntasGraficasCard';

const ParticipantesRecientesCard = memo(({ participantes }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [menuPaginasAbierto, setMenuPaginasAbierto] = useState(false);
  const totalPaginas = Math.max(1, Math.ceil(participantes.length / PARTICIPANTES_RECIENTES_POR_PAGINA));

  const participantesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * PARTICIPANTES_RECIENTES_POR_PAGINA;
    return participantes.slice(inicio, inicio + PARTICIPANTES_RECIENTES_POR_PAGINA);
  }, [paginaActual, participantes]);

  const inicio = participantes.length === 0 ? 0 : (paginaActual - 1) * PARTICIPANTES_RECIENTES_POR_PAGINA + 1;
  const fin = Math.min(paginaActual * PARTICIPANTES_RECIENTES_POR_PAGINA, participantes.length);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
      <h2 className="text-xl font-semibold">Participantes recientes</h2>
      {participantes.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">{inicio}-{fin} de {participantes.length} participantes</p>
      )}

      <div className="mt-5 space-y-3">
        {participantes.length === 0 ? (
          <p className="rounded-2xl border border-white/5 bg-[#081120] p-5 text-sm text-gray-500">Aun no hay participantes.</p>
        ) : (
          participantesPaginados.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/5 bg-[#081120] p-4">
              <p className="font-medium text-white">{p.usuario}</p>
              <p className="mt-1 truncate text-sm text-gray-500">{p.email || 'Sin correo'} - {formatearFecha(p.fecha)}</p>
            </div>
          ))
        )}
      </div>

      {participantes.length > PARTICIPANTES_RECIENTES_POR_PAGINA && (
        <div className="mt-5 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-3 border-t border-white/5 pt-4">
          <button type="button" onClick={() => setPaginaActual((p) => Math.max(1, p - 1))} disabled={paginaActual === 1} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 disabled:opacity-40">
            <FaChevronLeft size={13} />
          </button>

          <div className="relative min-w-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMenuPaginasAbierto(false); }}>
            <button type="button" onClick={() => setMenuPaginasAbierto((a) => !a)} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm text-red-200">
              Pagina {paginaActual} de {totalPaginas}
              <FaChevronDown size={12} className={`transition ${menuPaginasAbierto ? 'rotate-180' : ''}`} />
            </button>

            {menuPaginasAbierto && (
              <div className="absolute inset-x-0 bottom-12 z-20 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#081120] p-1 shadow-2xl">
                {Array.from({ length: totalPaginas }).map((_, index) => {
                  const pag = index + 1;
                  return (
                    <button key={pag} type="button" onClick={() => { setPaginaActual(pag); setMenuPaginasAbierto(false); }} className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm ${pag === paginaActual ? 'bg-red-500/20 text-red-200' : 'text-gray-300 hover:bg-white/5'}`}>
                      Pagina {pag} de {totalPaginas}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button type="button" onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#081120] text-gray-300 disabled:opacity-40">
            <FaChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
});
ParticipantesRecientesCard.displayName = 'ParticipantesRecientesCard';

// 🚀 COMPONENTE PRINCIPAL MIGRADO
const Reportes = () => {
  const [reporte, setReporte] = useState(null);
  const [proyectoId, setProyectoId] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const obtenerReportes = async () => {
      try {
        setLoading(true);
        setError(false);
        const { data } = await clienteAxios.get('/reportes', {
          ...obtenerConfig(),
          params: { proyectoId },
        });
        setReporte(data);
      } catch (err) {
        console.log(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    obtenerReportes();
  }, [proyectoId]);

  const proyectos = useMemo(() => reporte?.proyectos || [], [reporte]);
  const metricas = useMemo(() => reporte?.metricas || {}, [reporte]);
  const encuestas = useMemo(() => reporte?.encuestasResumen || [], [reporte]);
  const preguntas = useMemo(() => reporte?.resumenPreguntas || [], [reporte]);
  const participantes = useMemo(() => reporte?.participantes || [], [reporte]);
  const participacionTemporal = useMemo(() => reporte?.participacionTemporal || [], [reporte]);

  const proyectoNombre = useMemo(() => {
    if (proyectoId === 'todos') return 'Todos los proyectos';
    return proyectos.find((p) => String(p.id) === String(proyectoId))?.nombre_proyecto || 'Proyecto seleccionado';
  }, [proyectoId, proyectos]);

  const exportarPdf = () => {
    if (!reporte) return;
    const ventana = window.open('', '_blank', 'width=1100,height=800');
    if (!ventana) return;
    ventana.document.write(construirPdfHtml(reporte, proyectoNombre));
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-10 text-center text-gray-400">
          Cargando reportes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-10 text-center text-red-200">
          No se pudo cargar la informacion de reportes.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 text-white">
      <PageHeader
        eyebrow="Analisis y exportacion"
        title="Reportes"
        description="Genera reportes ejecutivos sobre encuestas, participacion y respuestas comunes por proyecto."
        actions={
          <>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                <FaFilter /> Proyecto
              </span>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="h-11 min-w-72 rounded-2xl border border-white/10 bg-[#0d1b34] px-4 text-sm text-white outline-none focus:border-red-500/40"
              >
                <option value="todos">Todos los proyectos</option>
                {proyectos.map((p) => (
                  <option key={`proyecto-${p.id}`} value={p.id}>{p.nombre_proyecto}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={exportarPdf}
              className="flex h-11 items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <FaFilePdf /> Descargar PDF
            </button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Encuestas', valor: metricas.encuestas || 0, icono: FaPoll, color: 'text-purple-400', fondo: 'bg-purple-500/10' },
          { label: 'Preguntas', valor: metricas.preguntas || 0, icono: FaQuestionCircle, color: 'text-blue-400', fondo: 'bg-blue-500/10' },
          { label: 'Participaciones', valor: metricas.respuestas || 0, icono: FaUsers, color: 'text-emerald-400', fondo: 'bg-emerald-500/10' },
          { label: 'Promedio por encuesta', valor: metricas.promedioRespuestasPorEncuesta || 0, icono: FaDownload, color: 'text-red-400', fondo: 'bg-red-500/10' },
        ].map((item) => {
          const Icono = item.icono;
          return (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold">{formatoNumero.format(item.valor)}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.fondo}`}>
                  <Icono className={item.color} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Respuestas por encuesta</h2>
              <p className="mt-1 text-sm text-gray-400">Comparativo de participacion entre instrumentos.</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={encuestas.slice(0, 8)}>
                  <CartesianGrid stroke="#ffffff14" vertical={false} />
                  <XAxis dataKey="titulo" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => v.length > 14 ? `${v.slice(0, 14)}...` : v} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#081120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="respuestas" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Participacion temporal</h2>
              <p className="mt-1 text-sm text-gray-400">Respuestas recibidas por fecha.</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={participacionTemporal}>
                  <CartesianGrid stroke="#ffffff14" vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#081120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <PreguntasGraficasCard key={proyectoId} preguntas={preguntas} />
        </div>

        <aside className="space-y-6">
          <RespuestasComunesCard key={proyectoId} preguntas={preguntas} />
          <ParticipantesRecientesCard key={proyectoId} participantes={participantes} />
        </aside>
      </section>
    </div>
  );
};

export default Reportes;