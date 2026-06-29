import { createContext, useEffect, useState } from 'react';
import clienteAxios from '../config/clienteAxios';
import useAuth from '../hooks/useAuth';

const EncuestasContext = createContext();

const EncuestasProvider = ({ children }) => {
  const [encuestas, setEncuestas] = useState([]);
  // 1. NUEVO ESTADO PARA LA PAPELERA DE ENCUESTAS
  const [encuestasEliminadas, setEncuestasEliminadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encuestaEditar, setEncuestaEditar] = useState(null);
  const [preguntasEncuesta, setPreguntasEncuesta] = useState([]);
  const { auth } = useAuth();

  const [toast, setToast] = useState({
    abierto: false,
    tipo: 'info',
    texto: '',
  });

  const cerrarToast = () => {
    setToast({
      abierto: false,
      tipo: 'info',
      texto: '',
    });
  };

  const obtenerConfig = () => {
    const token = localStorage.getItem('token');

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const obtenerEncuestas = async () => {
    try {
      const { data } = await clienteAxios.get(
        '/encuestas',
        obtenerConfig()
      );

      setEncuestas(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. NUEVA FUNCIÓN PARA TRAER LA PAPELERA DE ENCUESTAS
  const obtenerEncuestasEliminadas = async () => {
    try {
      const { data } = await clienteAxios.get(
        '/encuestas/eliminados',
        obtenerConfig()
      );
      setEncuestasEliminadas(data);
    } catch (error) {
      console.log(error);
    }
  };

  // 3. NUEVA FUNCIÓN PARA RESTAURAR ENCUESTAS desde la papelera
  const restaurarEncuesta = async (id) => {
    try {
      await clienteAxios.put(
        `/encuestas/restaurar/${id}`,
        {},
        obtenerConfig()
      );

      // Remover del estado local de la papelera inmediatamente
      setEncuestasEliminadas((prev) => prev.filter((e) => e.id !== id));

      // Recargar las encuestas activas para que vuelva a figurar en las tablas principales
      obtenerEncuestas();

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Encuesta restaurada correctamente',
      });
    } catch (error) {
      console.log(error);
      setToast({
        abierto: true,
        tipo: 'error',
        texto: 'Error al restaurar encuesta',
      });
    }
  };

  // NUEVA FUNCIÓN: ELIMINAR ENCUESTA PERMANENTEMENTE (BORRADO FÍSICO)
  const eliminarEncuestaPermanente = async (id) => {
    try {
      await clienteAxios.delete(
        `/encuestas/permanente/${id}`,
        obtenerConfig()
      );

      // Filtrar el estado de eliminadas para quitarla visualmente al instante
      setEncuestasEliminadas((prev) => prev.filter((e) => e.id !== id));

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Encuesta eliminada definitivamente',
      });
    } catch (error) {
      console.log(error);
      setToast({
        abierto: true,
        tipo: 'error',
        texto: error.response?.data?.msg || 'Error al eliminar encuesta permanentemente',
      });
    }
  };

  const crearEncuesta = async (encuesta) => {
    try {
      const config = obtenerConfig();

      config.headers['Content-Type'] =
        'application/json';

      const { data } = await clienteAxios.post(
        '/encuestas',
        encuesta,
        config
      );

      setEncuestas((prev) => [data, ...prev]);

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Encuesta creada correctamente',
      });

      return {
        ok: true,
        encuesta: data,
      };
    } catch (error) {
      console.log(error);

      setToast({
        abierto: true,
        tipo: 'error',
        texto: 'Error al crear encuesta',
      });

      return {
        ok: false,
      };
    }
  };

  const editarEncuesta = async (encuesta) => {
    try {
      const config = obtenerConfig();

      config.headers['Content-Type'] =
        'application/json';

      const { data } = await clienteAxios.put(
        `/encuestas/${encuesta.id}`,
        encuesta,
        config
      );

      const actualizadas = encuestas.map((e) =>
        e.id === data.id ? data : e
      );

      setEncuestas(actualizadas);

      setEncuestaEditar(null);

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Encuesta actualizada correctamente',
      });

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      setToast({
        abierto: true,
        tipo: 'error',
        texto: 'Error al editar encuesta',
      });

      return {
        ok: false,
      };
    }
  };

  const eliminarEncuesta = async (id) => {
    try {
      await clienteAxios.delete(
        `/encuestas/${id}`,
        obtenerConfig()
      );

      // Al eliminar, la filtramos del listado de encuestas activas
      setEncuestas((prev) =>
        prev.filter((e) => e.id !== id)
      );

      // Y podemos refrescar la papelera para que aparezca ahí abajo de inmediato
      obtenerEncuestasEliminadas();

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
      };
    }
  };

  const obtenerPreguntasEncuesta = async (
    encuestaId
  ) => {
    try {
      const { data } = await clienteAxios.get(
        `/encuestas-preguntas/${encuestaId}`,
        obtenerConfig()
      );

      setPreguntasEncuesta(data);

      return data;
    } catch (error) {
      console.log(error);

      return [];
    }
  };

  const guardarPreguntasEncuesta = async (
    encuestaId,
    preguntas
  ) => {
    try {
      const config = obtenerConfig();

      config.headers['Content-Type'] =
        'application/json';

      await clienteAxios.post(
        `/encuestas-preguntas/${encuestaId}`,
        { preguntas },
        config
      );

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Preguntas guardadas correctamente',
      });

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      const mensaje =
        error.response?.data?.msg ||
        'Error al guardar preguntas';

      setToast({
        abierto: true,
        tipo: 'error',
        texto: mensaje,
      });

      return {
        ok: false,
        msg: mensaje,
      };
    }
  };

  const responderEncuesta = async (
    encuestaId,
    respuestas
  ) => {
    try {
      const config = obtenerConfig();

      config.headers['Content-Type'] =
        'application/json';

      await clienteAxios.post(
        `/encuestas-respuestas/${encuestaId}`,
        {
          respuestas,
        },
        config
      );

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Encuesta respondida correctamente',
      });

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      const mensaje =
        error.response?.data?.msg ||
        'Error al responder encuesta';

      setToast({
        abierto: true,
        tipo: 'error',
        texto: mensaje,
      });

      return {
        ok: false,
        msg: mensaje,
      };
    }
  };

  const obtenerRespuestasEncuesta = async (
    encuestaId
  ) => {
    try {
      const { data } = await clienteAxios.get(
        `/encuestas-respuestas/${encuestaId}`,
        obtenerConfig()
      );

      return data;
    } catch (error) {
      console.log(error);

      return [];
    }
  };

  const obtenerEstadoRespuestaEncuesta = async (
    encuestaId
  ) => {
    try {
      const { data } = await clienteAxios.get(
        `/encuestas-respuestas/${encuestaId}/estado`,
        obtenerConfig()
      );

      return data;
    } catch (error) {
      console.log(error);

      return {
        respondida: false,
      };
    }
  };

  const generarEnlaceEncuesta = async (encuestaId) => {
    try {
      const { data } = await clienteAxios.post(
        `/encuestas-enlaces/${encuestaId}`,
        {},
        obtenerConfig()
      );

      const url = `${window.location.origin}/encuestas/enlace/${data.token}`;

      return {
        ok: true,
        url,
        token: data.token,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg:
          error.response?.data?.msg ||
          'Error al generar enlace',
      };
    }
  };

  useEffect(() => {
    if (!auth?.id) {
      setEncuestas([]);
      setEncuestasEliminadas([]);
      setPreguntasEncuesta([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    obtenerEncuestas();

    // 4. PRECARGAR PAPELERA DE ENCUESTAS SI EL USUARIO ES ADMIN
    if (auth?.rol === 'admin') {
      obtenerEncuestasEliminadas();
    }
  }, [auth?.id, auth?.rol]);

  return (
    <EncuestasContext.Provider
      value={{
        encuestas,
        encuestasEliminadas,
        obtenerEncuestasEliminadas,
        restaurarEncuesta,
        // EXPORTAMOS LA NUEVA FUNCIÓN AL CONTEXTO
        eliminarEncuestaPermanente,
        loading,
        toast,
        cerrarToast,
        encuestaEditar,
        setEncuestaEditar,
        preguntasEncuesta,
        setPreguntasEncuesta,
        crearEncuesta,
        editarEncuesta,
        eliminarEncuesta,
        obtenerPreguntasEncuesta,
        guardarPreguntasEncuesta,
        responderEncuesta,
        obtenerRespuestasEncuesta,
        obtenerEstadoRespuestaEncuesta,
        generarEnlaceEncuesta,
      }}
    >
      {children}
    </EncuestasContext.Provider>
  );
};

export { EncuestasProvider };

export default EncuestasContext;