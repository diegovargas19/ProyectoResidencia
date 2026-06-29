import { createContext, useEffect, useState } from 'react';
import clienteAxios from '../config/clienteAxios';
import useAuth from '../hooks/useAuth';

const ProyectosContext = createContext();

const ProyectosProvider = ({ children }) => {
  const [proyectos, setProyectos] = useState([]);
  // 1. ESTADO NUEVO PARA LA PAPELERA
  const [proyectosEliminados, setProyectosEliminados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proyectoEditar, setProyectoEditar] = useState(null);
  const { auth } = useAuth();

  const obtenerProyectos = async () => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await clienteAxios.get(
        '/proyectos',
        config
      );

      setProyectos(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. NUEVA FUNCIÓN PARA TRAER LA PAPELERA
  const obtenerProyectosEliminados = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await clienteAxios.get(
        '/proyectos/eliminados',
        config
      );
      setProyectosEliminados(data);
    } catch (error) {
      console.log(error);
    }
  };

  // 3. NUEVA FUNCIÓN PARA RESTAURAR PROYECTOS
  const restaurarProyecto = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await clienteAxios.put(
        `/proyectos/restaurar/${id}`,
        {},
        config
      );

      // Removerlo de la lista de eliminados localmente
      setProyectosEliminados((prev) => prev.filter((p) => p.id !== id));
      
      // Volver a cargar los proyectos activos para que aparezca de nuevo en la tabla principal
      obtenerProyectos();
    } catch (error) {
      console.log(error);
    }
  };

  // NUEVA FUNCIÓN: ELIMINAR PROYECTO PERMANENTEMENTE (BORRADO FÍSICO)
  const eliminarProyectoPermanente = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      };

      // Petición DELETE a la ruta permanente del backend
      await clienteAxios.delete(`/proyectos/permanente/${id}`, config);

      // Filtrar el estado para removerlo visualmente de la tabla al instante
      setProyectosEliminados((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.log(error.response?.data?.msg || "Error al eliminar permanentemente");
    }
  };

  const obtenerProyecto = async (id) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await clienteAxios.get(
        `/proyectos/${id}`,
        config
      );

      return data;
    } catch (error) {
      console.log(error);

      return null;
    }
  };

  const crearProyecto = async (proyecto) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await clienteAxios.post(
        '/proyectos',
        proyecto,
        config
      );

      setProyectos((prev) => [...prev, data]);

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg:
          error.response?.data?.msg ||
          'Error al crear proyecto',
      };
    }
  };

  const editarProyecto = async (proyecto) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await clienteAxios.put(
        `/proyectos/${proyecto.id}`,
        proyecto,
        config
      );

      const proyectosActualizados = proyectos.map((p) =>
        p.id === data.id ? data : p
      );

      setProyectos(proyectosActualizados);

      setProyectoEditar(null);

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg:
          error.response?.data?.msg ||
          'Error al actualizar proyecto',
      };
    }
  };

  const actualizarColaboradoresProyecto = async (
    proyectoId,
    colaboradorIds
  ) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await clienteAxios.put(
        `/proyectos/${proyectoId}/colaboradores`,
        {
          colaborador_ids: colaboradorIds,
        },
        config
      );

      setProyectos((prev) =>
        prev.map((proyecto) =>
          proyecto.id === data.id ? data : proyecto
        )
      );

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg:
          error.response?.data?.msg ||
          'Error al actualizar colaboradores',
      };
    }
  };

  const eliminarProyecto = async (id) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await clienteAxios.delete(
        `/proyectos/${id}`,
        config
      );

      setProyectos((prev) =>
        prev.filter((p) => p.id !== id)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const subirArchivos = async (
    proyectoId,
    archivos
  ) => {
    try {
      const token = localStorage.getItem('token');

      const formData = new FormData();

      archivos.forEach((archivo) => {
        formData.append('archivos', archivo);
      });

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const { data } = await clienteAxios.post(
        `/archivos/${proyectoId}`,
        formData,
        config
      );

      return {
        ok: true,
        data,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg:
          error.response?.data?.msg ||
          'Error al subir archivos',
      };
    }
  };

  const eliminarArchivo = async (id) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await clienteAxios.delete(
        `/archivos/${id}`,
        config
      );

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

  useEffect(() => {
    if (!auth?.id) {
      setProyectos([]);
      setProyectosEliminados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    obtenerProyectos();
    // También podemos precargar la papelera si el usuario es admin
    if (auth?.rol === 'admin') {
      obtenerProyectosEliminados();
    }
  }, [auth?.id, auth?.rol]);

  return (
    <ProyectosContext.Provider
      value={{
        proyectos,
        proyectosEliminados,
        obtenerProyectosEliminados,
        restaurarProyecto,
        // EXPORTAMOS LA NUEVA FUNCIÓN DE BORRADO DEFINITIVO
        eliminarProyectoPermanente, 
        loading,
        crearProyecto,
        eliminarProyecto,
        editarProyecto,
        obtenerProyectos,
        obtenerProyecto,
        actualizarColaboradoresProyecto,
        subirArchivos,
        eliminarArchivo,
        proyectoEditar,
        setProyectoEditar,
      }}
    >
      {children}
    </ProyectosContext.Provider>
  );
};

export { ProyectosProvider };

export default ProyectosContext;