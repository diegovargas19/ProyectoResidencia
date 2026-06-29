import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaCheckCircle,
  FaPaperPlane,
} from 'react-icons/fa';
import clienteAxios from '../config/clienteAxios';

const EncuestaEnlace = () => {
  const { token } = useParams();
  const [encuesta, setEncuesta] = useState(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [enviada, setEnviada] = useState(false);

  useEffect(() => {
    const cargarEncuesta = async () => {
      try {
        const { data } = await clienteAxios.get(
          `/encuestas-enlaces/publico/${token}`
        );

        setEncuesta(data);
      } catch (error) {
        setMensaje(
          error.response?.data?.msg ||
            'No se pudo cargar la encuesta'
        );
      } finally {
        setLoading(false);
      }
    };

    cargarEncuesta();
  }, [token]);

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
      return;
    }

    handleChange(preguntaId, [...actual, opcion]);
  };

  const validarObligatorias = () => {
    return encuesta.preguntas.every((pregunta) => {
      if (!pregunta.obligatoria) return true;

      const respuesta = respuestas[pregunta.id];

      if (Array.isArray(respuesta)) {
        return respuesta.length > 0;
      }

      return String(respuesta || '').trim() !== '';
    });
  };

  const handleEnviar = async () => {
    if (!nombreCompleto.trim()) {
      Swal.fire({
        title: 'Nombre requerido',
        text: 'Captura tu nombre completo antes de enviar la encuesta.',
        icon: 'warning',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });

      return;
    }

    if (!validarObligatorias()) {
      Swal.fire({
        title: 'Faltan respuestas',
        text: 'Responde todas las preguntas obligatorias.',
        icon: 'warning',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });

      return;
    }

    const respuestasPreparadas = Object.entries(respuestas).map(
      ([pregunta_id, respuesta]) => ({
        pregunta_id,
        respuesta,
      })
    );

    try {
      await clienteAxios.post(
        `/encuestas-enlaces/publico/${token}`,
        {
          nombre_completo: nombreCompleto,
          respuestas: respuestasPreparadas,
        }
      );

      setEnviada(true);
    } catch (error) {
      Swal.fire({
        title: 'No se pudo enviar',
        text:
          error.response?.data?.msg ||
          'Ocurrio un problema al guardar la encuesta',
        icon: 'error',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#081120] p-6 text-white">
        Cargando encuesta...
      </div>
    );
  }

  if (mensaje) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081120] p-6 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b162c] p-8 text-center">
          <h1 className="text-2xl font-bold">Enlace no disponible</h1>
          <p className="mt-3 text-gray-300">{mensaje}</p>
        </div>
      </div>
    );
  }

  if (enviada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081120] p-6 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-emerald-500/20 bg-[#0b162c] p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <FaCheckCircle size={28} />
          </div>
          <h1 className="text-2xl font-bold">Encuesta enviada</h1>
          <p className="mt-3 text-gray-300">
            Tus respuestas fueron registradas correctamente. Este enlace ya no podra volver a usarse.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081120] p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-[#0b162c] p-8">
          <p className="text-sm text-gray-400">Encuesta</p>
          <h1 className="mt-2 text-3xl font-bold">{encuesta.titulo}</h1>
          {encuesta.descripcion && (
            <p className="mt-3 text-gray-300">{encuesta.descripcion}</p>
          )}
        </header>

        <section className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
          <label className="mb-3 block text-sm font-medium text-gray-300">
            Nombre completo
          </label>

          <input
            type="text"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            placeholder="Escribe tu nombre completo..."
            className="w-full rounded-2xl border border-white/10 bg-[#081120] px-5 py-4 text-white outline-none"
          />
        </section>

        <div className="space-y-6">
          {encuesta.preguntas.map((pregunta, index) => (
            <div
              key={pregunta.id}
              className="rounded-3xl border border-white/10 bg-[#0b162c] p-6"
            >
              <div className="mb-6">
                <p className="text-sm text-gray-400">Pregunta {index + 1}</p>
                <h2 className="mt-2 text-lg font-semibold">
                  {pregunta.pregunta}
                </h2>
                {pregunta.obligatoria && (
                  <p className="mt-1 text-sm text-red-400">Obligatoria</p>
                )}
              </div>

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
                      <input
                        type="checkbox"
                        onChange={() => handleMultiple(pregunta.id, opcion)}
                      />
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
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleEnviar}
            className="flex items-center gap-3 rounded-2xl bg-red-800 px-6 py-3 font-medium transition hover:bg-red-700"
          >
            <FaPaperPlane />
            Enviar respuestas
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncuestaEnlace;
