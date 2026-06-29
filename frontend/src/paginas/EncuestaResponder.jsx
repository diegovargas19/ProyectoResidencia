import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaArrowLeft, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import useEncuestas from '../hooks/useEncuestas';
import PageHeader from '../components/ui/PageHeader';

const EncuestaResponder = () => {
  const navigate = useNavigate();

  const { id } = useParams();
  const { obtenerPreguntasEncuesta, preguntasEncuesta, responderEncuesta } = useEncuestas();
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    obtenerPreguntasEncuesta(id);
  }, []);

  const handleChange = (preguntaId, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaId]: valor,
    }));
  };

  const handleMultiple = (preguntaId, opcion) => {
    const actual = respuestas[preguntaId] || [];

    if (actual.includes(opcion)) {
      handleChange(
        preguntaId,
        actual.filter((item) => item !== opcion)
      );
    } else {
      handleChange(preguntaId, [...actual, opcion]);
    }
  };

  const handleEnviar = async () => {
    const respuestasPreparadas = Object.entries(respuestas).map(([pregunta_id, respuesta]) => ({
      pregunta_id,
      respuesta,
    }));

    const resultado = await responderEncuesta(id, respuestasPreparadas);

    if (resultado.ok) {
      await Swal.fire({
        title: 'Encuesta enviada',
        text: 'Tus respuestas fueron registradas correctamente',
        icon: 'success',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });

      navigate('/app/encuestas');
    } else {
      Swal.fire({
        title: 'Error',
        text: resultado.msg || 'No se pudo guardar la encuesta',
        icon: 'error',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Responder encuesta"
        description="Completa las preguntas requeridas."
        backButton={
          <button
            onClick={() => navigate('/app/encuestas')}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1b34] transition hover:bg-[#122044]"
          >
            <FaArrowLeft />
          </button>
        }
        actions={
          <button
            onClick={handleEnviar}
            className="flex items-center gap-3 rounded-2xl bg-red-800 px-6 py-3 font-medium transition hover:bg-red-700"
          >
            <FaPaperPlane />
            Enviar respuestas
          </button>
        }
      />

      {/* Preguntas */}
      <div className="space-y-6">
        {preguntasEncuesta.map((pregunta, index) => (
          <div key={pregunta.id} className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <FaCheckCircle />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">Pregunta {index + 1}</h3>

                  {pregunta.obligatoria && <p className="text-sm text-red-400">Obligatoria</p>}
                </div>
              </div>

              <p className="text-lg text-white">{pregunta.pregunta}</p>
            </div>

            <div>
              {pregunta.tipo === 'texto' && (
                <input
                  type="text"
                  placeholder="Escribe tu respuesta..."
                  onChange={(e) => handleChange(pregunta.id, e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#081120] px-5 py-4 text-white outline-none"
                />
              )}

              {pregunta.tipo === 'textarea' && (
                <textarea
                  rows={5}
                  placeholder="Escribe tu respuesta..."
                  onChange={(e) => handleChange(pregunta.id, e.target.value)}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#081120] px-5 py-4 text-white outline-none"
                />
              )}

              {pregunta.tipo === 'opcion_unica' && (
                <div className="space-y-3">
                  {pregunta.opciones.map((opcion, i) => (
                    <label key={i} className="flex items-center gap-3 text-gray-300">
                      <input
                        type="radio"
                        name={`pregunta-${pregunta.id}`}
                        value={opcion}
                        onChange={(e) => handleChange(pregunta.id, e.target.value)}
                      />

                      {opcion}
                    </label>
                  ))}
                </div>
              )}

              {pregunta.tipo === 'multiple' && (
                <div className="space-y-3">
                  {pregunta.opciones.map((opcion, i) => (
                    <label key={i} className="flex items-center gap-3 text-gray-300">
                      <input type="checkbox" onChange={() => handleMultiple(pregunta.id, opcion)} />

                      {opcion}
                    </label>
                  ))}
                </div>
              )}

              {pregunta.tipo === 'escala' && (
                <div className="flex flex-wrap items-center gap-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleChange(pregunta.id, item)}
                      className={`h-12 w-12 rounded-2xl border transition ${
                        respuestas[pregunta.id] === item
                          ? 'border-red-700 bg-red-800 text-white'
                          : 'border-white/10 bg-[#081120] text-gray-400'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EncuestaResponder;
