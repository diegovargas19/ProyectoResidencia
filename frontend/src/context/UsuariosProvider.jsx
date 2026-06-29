import { createContext, useEffect, useState } from 'react';
import clienteAxios from '../config/clienteAxios';
import useAuth from '../hooks/useAuth';

const UsuariosContext = createContext();

const UsuariosProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  // 1. NUEVO ESTADO PARA LA LISTA DE USUARIOS BLOQUEADOS
  const [usuariosBloqueados, setUsuariosBloqueados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const { auth } = useAuth();

  const obtenerConfig = () => {
    const token = localStorage.getItem('token');

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // =========================================
  // OBTENER USUARIOS (ACTIVOS)
  // =========================================
  const obtenerUsuarios = async () => {
    try {
      const { data } = await clienteAxios.get('/usuarios/usuarios', obtenerConfig());

      setUsuarios(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // NUEVA: OBTENER USUARIOS BLOQUEADOS
  // =========================================
  const obtenerUsuariosBloqueados = async () => {
    try {
      const { data } = await clienteAxios.get('/usuarios/usuarios-bloqueados', obtenerConfig());
      setUsuariosBloqueados(data);
    } catch (error) {
      console.log(error);
    }
  };

  // =========================================
  // CREAR USUARIO
  // =========================================
  const crearUsuario = async (usuario) => {
    try {
      const config = obtenerConfig();

      config.headers['Content-Type'] = 'application/json';

      const { data } = await clienteAxios.post('/usuarios/registro', usuario, config);

      setUsuarios((prev) => [data.usuario, ...prev]);

      return {
        ok: true,
        usuario: data.usuario,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg: error.response?.data?.msg || 'Error al crear usuario',
      };
    }
  };

  // =========================================
  // EDITAR USUARIO
  // =========================================
  const editarUsuario = async (usuario) => {
    try {
      const config = obtenerConfig();

      config.headers['Content-Type'] = 'application/json';

      await clienteAxios.put(`/usuarios/usuarios/${usuario.id}`, usuario, config);

      const actualizados = usuarios.map((u) =>
        u.id === usuario.id ? usuario : u
      );

      setUsuarios(actualizados);

      setUsuarioEditar(null);

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

  // =========================================
  // ELIMINAR USUARIO (AHORA BLOQUEO LÓGICO)
  // =========================================
  const eliminarUsuario = async (id) => {
    try {
      await clienteAxios.delete(`/usuarios/usuarios/${id}`, obtenerConfig());

      // Lo quitamos de la lista de usuarios activos
      setUsuarios((prev) => prev.filter((u) => u.id !== id));

      // Actualizamos la papelera de bloqueados inmediatamente
      obtenerUsuariosBloqueados();

      return {
        ok: true,
      };
    } catch (error) {
      console.log(error);

      return {
        ok: false,
        msg: error.response?.data?.msg || 'Error al bloquear usuario',
      };
    }
  };

  // =========================================
  // NUEVA: RESTAURAR / DESBLOQUEAR USUARIO
  // =========================================
  const restaurarUsuario = async (id) => {
    try {
      await clienteAxios.put(`/usuarios/usuarios-restaurar/${id}`, {}, obtenerConfig());

      // Sacar de la lista de bloqueados
      setUsuariosBloqueados((prev) => prev.filter((u) => u.id !== id));

      // Recargar activos para que vuelva a aparecer en la tabla principal
      obtenerUsuarios();

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

  // =========================================
  // NUEVA: ELIMINAR USUARIO DEFINITIVAMENTE
  // =========================================
  const eliminarUsuarioPermanente = async (id) => {
    try {
      await clienteAxios.delete(`/usuarios/usuarios-permanente/${id}`, obtenerConfig());

      // Eliminar definitivamente del estado local
      setUsuariosBloqueados((prev) => prev.filter((u) => u.id !== id));

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
      setUsuarios([]);
      setUsuariosBloqueados([]);
      setLoading(false);
      return;
    }

    if (!['admin', 'investigador'].includes(auth.rol)) {
      setUsuarios([]);
      setUsuariosBloqueados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    obtenerUsuarios();

    // Si el usuario es administrador, precargamos su papelera de bloqueados
    if (auth.rol === 'admin') {
      obtenerUsuariosBloqueados();
    }
  }, [auth?.id, auth?.rol]);

  return (
    <UsuariosContext.Provider
      value={{
        usuarios,
        // EXPORTAMOS LOS NUEVOS VALORES AL CONTEXTO
        usuariosBloqueados,
        obtenerUsuariosBloqueados,
        restaurarUsuario,
        eliminarUsuarioPermanente,
        loading,
        usuarioEditar,
        setUsuarioEditar,
        crearUsuario,
        editarUsuario,
        eliminarUsuario,
      }}
    >
      {children}
    </UsuariosContext.Provider>
  );
};

export { UsuariosProvider };

export default UsuariosContext;