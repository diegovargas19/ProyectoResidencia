import { createContext, useEffect, useState } from 'react';
import clienteAxios from '../config/clienteAxios';
import useAuth from '../hooks/useAuth';

const DepartamentosContext = createContext();

const DepartamentosProvider = ({ children }) => {
  const [departamentos, setDepartamentos] = useState([]);
  const [loadingDepartamentos, setLoadingDepartamentos] =
    useState(true);
  const { auth } = useAuth();

  const obtenerConfig = () => {
    const token = localStorage.getItem('token');

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const obtenerDepartamentos = async () => {
    try {
      const { data } = await clienteAxios.get(
        '/departamentos',
        obtenerConfig()
      );

      setDepartamentos(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingDepartamentos(false);
    }
  };

  const crearDepartamento = async (nombre) => {
    try {
      const config = obtenerConfig();
      config.headers['Content-Type'] = 'application/json';

      const { data } = await clienteAxios.post(
        '/departamentos',
        { nombre },
        config
      );

      setDepartamentos((prev) =>
        [...prev, data].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        )
      );

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg:
          error.response?.data?.msg ||
          'Error al crear departamento',
      };
    }
  };

  const eliminarDepartamento = async (id) => {
    try {
      await clienteAxios.delete(
        `/departamentos/${id}`,
        obtenerConfig()
      );

      setDepartamentos((prev) =>
        prev.filter((departamento) => departamento.id !== id)
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
      setDepartamentos([]);
      setLoadingDepartamentos(false);
      return;
    }

    setLoadingDepartamentos(true);
    obtenerDepartamentos();
  }, [auth?.id]);

  return (
    <DepartamentosContext.Provider
      value={{
        departamentos,
        loadingDepartamentos,
        crearDepartamento,
        eliminarDepartamento,
        obtenerDepartamentos,
      }}
    >
      {children}
    </DepartamentosContext.Provider>
  );
};

export { DepartamentosProvider };

export default DepartamentosContext;
