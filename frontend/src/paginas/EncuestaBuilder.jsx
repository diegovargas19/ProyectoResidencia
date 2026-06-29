import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaSave,
  FaGripVertical,
  FaFont,
  FaList,
  FaCheckCircle,
  FaSlidersH,
} from 'react-icons/fa';
import ToastMensaje from '../components/ui/ToastMensaje';
import useEncuestas from '../hooks/useEncuestas';

const tiposPregunta = [
  {
    value: 'texto',
    label: 'Texto corto',
    icon: <FaFont />,
  },
  {
    value: 'textarea',
    label: 'Texto largo',
    icon: <FaFont />,
  },
  {
    value: 'opcion_unica',
    label: 'Opción única',
    icon: <FaCheckCircle />,
  },
  {
    value: 'multiple',
    label: 'Selección múltiple',
    icon: <FaList />,
  },
  {
    value: 'escala',
    label: 'Escala 1-5',
    icon: <FaSlidersH />,
  },
];

const estadosEncuesta = [
  'Borrador',
  'Activa',
  'Finalizada',
];

const fechaYaPaso = (fecha) => {
  if (!fecha) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fin = new Date(`${fecha}T00:00:00`);

  return hoy > fin;
};

const EncuestaBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [preguntas, setPreguntas] = useState([]);
  const [estado, setEstado] = useState('Borrador');
  const {
    encuestas,
    editarEncuesta,
    obtenerPreguntasEncuesta,
    guardarPreguntasEncuesta,
    preguntasEncuesta,
    toast,
    cerrarToast,
  } = useEncuestas();

  const encuestaActual = encuestas.find(
    (encuesta) => String(encuesta.id) === String(id)
  );
  const encuestaVencida = fechaYaPaso(encuestaActual?.fecha_fin);

  useEffect(() => {
    obtenerPreguntasEncuesta(id);
  }, [id]);

  useEffect(() => {
    const encuestaActual = encuestas.find(
      (encuesta) => String(encuesta.id) === String(id)
    );

    if (encuestaActual?.estado) {
      setEstado(encuestaActual.estado);
    }
  }, [encuestas, id]);

  useEffect(() => {
    if (preguntasEncuesta?.length > 0) {
      setPreguntas(preguntasEncuesta);
    } else {
      setPreguntas([
        {
          id: Date.now(),
          pregunta: '',
          tipo: 'texto',
          obligatoria: true,
          opciones: [''],
        },
      ]);
    }
  }, [preguntasEncuesta]);

  const agregarPregunta = () => {
    setPreguntas((prev) => [
      ...prev,
      {
        id: Date.now(),
        pregunta: '',
        tipo: 'texto',
        obligatoria: true,
        opciones: [''],
      },
    ]);
  };

  const eliminarPregunta = (idPregunta) => {
    setPreguntas((prev) => prev.filter((item) => item.id !== idPregunta));
  };

  const actualizarPregunta = (idPregunta, campo, valor) => {
    setPreguntas((prev) =>
      prev.map((item) =>
        item.id === idPregunta
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  };

  const actualizarOpcion = (preguntaId, index, valor) => {
    setPreguntas((prev) =>
      prev.map((item) => {
        if (item.id !== preguntaId) return item;
        const nuevasOpciones = [...item.opciones];
        nuevasOpciones[index] = valor;
        return {
          ...item,
          opciones: nuevasOpciones,
        };
      })
    );
  };

  const agregarOpcion = (preguntaId) => {
    setPreguntas((prev) =>
      prev.map((item) => {
        if (item.id !== preguntaId) return item;
        return {
          ...item,
          opciones: [...item.opciones, ''],
        };
      })
    );
  };

  const handleGuardar = async () => {
    const resultado = await guardarPreguntasEncuesta(id, preguntas);

    if (!resultado.ok) return;

    await editarEncuesta({
      id,
      estado,
    });
  };

  return (
    <>
      <ToastMensaje
        abierto={toast.abierto}
        tipo={toast.tipo}
        texto={toast.texto}
        onClose={cerrarToast}
      />

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app/encuestas')}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1b34] transition hover:bg-[#122044]"
            >
              <FaArrowLeft />
            </button>

            <div>
              <h1 className="text-3xl font-bold text-white">Constructor de Encuestas</h1>

              <p className="mt-1 text-gray-400">
                Agrega y organiza preguntas dinámicas para la encuesta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-3 font-medium text-white outline-none transition focus:border-red-500/40"
            >
              {estadosEncuesta.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={agregarPregunta}
              disabled={encuestaVencida}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-3 font-medium transition hover:bg-[#122044]"
            >
              <FaPlus />
              Agregar pregunta
            </button>

            <button
              onClick={handleGuardar}
              disabled={encuestaVencida}
              className="flex items-center gap-3 rounded-2xl bg-red-800 px-6 py-3 font-medium transition hover:bg-red-700"
            >
              <FaSave />
              Guardar Encuesta
            </button>
          </div>
        </div>

        {encuestaVencida && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            La fecha de captura de esta encuesta ya vencio. Ya no se pueden guardar cambios.
          </div>
        )}

        {/* Preguntas */}
        <div className="space-y-6">
          {preguntas.map((pregunta, index) => (
            <div
              key={pregunta.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b162c]"
            >
              {/* Top */}
              <div className="flex items-center justify-between gap-4 border-b border-white/5 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
                    <FaGripVertical />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white">Pregunta {index + 1}</h3>

                    <p className="mt-1 text-sm text-gray-400">
                      Configura el contenido y el tipo de respuesta.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => eliminarPregunta(pregunta.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                >
                  <FaTrash />
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6 p-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-300">
                    Texto de la pregunta
                  </label>

                  <input
                    type="text"
                    value={pregunta.pregunta}
                    onChange={(e) => actualizarPregunta(pregunta.id, 'pregunta', e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                    className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Tipo */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">
                      Tipo de pregunta
                    </label>

                    <select
                      value={pregunta.tipo}
                      onChange={(e) => actualizarPregunta(pregunta.id, 'tipo', e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white outline-none"
                    >
                      {tiposPregunta.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Obligatoria */}
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-300">
                      Configuración
                    </label>

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4">
                      <div>
                        <h4 className="font-medium text-white">Pregunta obligatoria</h4>

                        <p className="mt-1 text-sm text-gray-400">
                          El usuario deberá responder esta pregunta.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={pregunta.obligatoria}
                        onChange={(e) =>
                          actualizarPregunta(pregunta.id, 'obligatoria', e.target.checked)
                        }
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                </div>

                {/* Opciones */}
                {(pregunta.tipo === 'opcion_unica' || pregunta.tipo === 'multiple') && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">
                        Opciones de respuesta
                      </label>

                      <button
                        onClick={() => agregarOpcion(pregunta.id)}
                        className="rounded-xl bg-blue-500/15 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-500/25"
                      >
                        + Agregar opción
                      </button>
                    </div>

                    <div className="space-y-3">
                      {pregunta.opciones.map((opcion, opcionIndex) => (
                        <input
                          key={opcionIndex}
                          type="text"
                          value={opcion}
                          onChange={(e) =>
                            actualizarOpcion(pregunta.id, opcionIndex, e.target.value)
                          }
                          placeholder={`Opción ${opcionIndex + 1}`}
                          className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white outline-none"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="rounded-3xl border border-white/5 bg-[#0d1b34] p-6">
                  <h4 className="mb-4 font-semibold text-white">Vista previa</h4>

                  <div className="space-y-4">
                    <p className="font-medium text-white">
                      {pregunta.pregunta || 'Tu pregunta aparecerá aquí'}
                    </p>

                    {pregunta.tipo === 'texto' && (
                      <input
                        disabled
                        placeholder="Respuesta corta"
                        className="w-full rounded-2xl border border-white/10 bg-[#081120] px-5 py-4 text-gray-500"
                      />
                    )}

                    {pregunta.tipo === 'textarea' && (
                      <textarea
                        disabled
                        rows={4}
                        placeholder="Respuesta larga"
                        className="w-full resize-none rounded-2xl border border-white/10 bg-[#081120] px-5 py-4 text-gray-500"
                      />
                    )}

                    {pregunta.tipo === 'opcion_unica' && (
                      <div className="space-y-3">
                        {pregunta.opciones.map((opcion, i) => (
                          <label key={i} className="flex items-center gap-3 text-gray-300">
                            <input type="radio" disabled />

                            {opcion || `Opción ${i + 1}`}
                          </label>
                        ))}
                      </div>
                    )}

                    {pregunta.tipo === 'multiple' && (
                      <div className="space-y-3">
                        {pregunta.opciones.map((opcion, i) => (
                          <label key={i} className="flex items-center gap-3 text-gray-300">
                            <input type="checkbox" disabled />

                            {opcion || `Opción ${i + 1}`}
                          </label>
                        ))}
                      </div>
                    )}

                    {pregunta.tipo === 'escala' && (
                      <div className="flex flex-wrap items-center gap-3">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <button
                            key={item}
                            disabled
                            className="h-12 w-12 rounded-2xl border border-white/10 bg-[#081120] text-gray-400"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default EncuestaBuilder;
