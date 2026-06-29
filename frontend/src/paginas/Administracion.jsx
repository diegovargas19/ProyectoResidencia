import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaTrash, FaUndo, FaKey } from 'react-icons/fa'; // Agregamos icono de llave
import TablaUsuarios from '../components/tablas/TablaUsuarios';
import ModalUsuario from '../components/modales/ModalUsuario';
import useUsuarios from '../hooks/useUsuarios';
import PageHeader from '../components/ui/PageHeader';
import useDepartamentos from '../hooks/useDepartamentos';
import useProyectos from '../hooks/useProyectos';
import useEncuestas from '../hooks/useEncuestas';
import clienteAxios from '../config/clienteAxios.jsx'; // Importamos tu cliente configurado

const Administracion = () => {
  // CONFIGURACIÓN ACTUALIZADA: Extraemos los nuevos estados y funciones de la papelera de usuarios
  const { 
    usuarios, 
    loading: loadingUsuarios,
    usuariosBloqueados,
    restaurarUsuario,
    eliminarUsuarioPermanente,
    obtenerUsuarios // Asegúrate de extraer tu función encargada de recargar la lista si existe
  } = useUsuarios();

  const {
    departamentos,
    crearDepartamento,
    eliminarDepartamento,
  } = useDepartamentos();
  
  const { 
    proyectosEliminados, 
    obtenerProyectosEliminados, 
    restaurarProyecto,
    eliminarProyectoPermanente 
  } = useProyectos();

  const {
    encuestasEliminadas,
    obtenerEncuestasEliminadas,
    restaurarEncuesta,
    eliminarEncuestaPermanente 
  } = useEncuestas();

  const [modalOpen, setModalOpen] = useState(false);
  const [nombreDepartamento, setNombreDepartamento] = useState('');

  // Filtramos en tiempo real si algún usuario de la lista activa solicita recuperación
  const solicitudesCambio = usuarios?.filter(u => u.token === 'SOLICITA_REINICIO') || [];

  // Sincronizar las papeleras al montar el componente
  useEffect(() => {
    obtenerProyectosEliminados();
    obtenerEncuestasEliminadas();
  }, []);

  // MANEJADOR PARA QUE EL ADMIN ASIGNE LA NUEVA CLAVE DIRECTA
  const handleCambiarPasswordManual = (usuario) => {
    const fullName = `${usuario.nombre} ${usuario.primer_apellido}`;
    
    Swal.fire({
      title: `Restablecer clave`,
      text: `Digita la nueva contraseña definitiva para ${fullName}:`,
      input: 'password',
      inputPlaceholder: 'Mínimo 6 caracteres',
      showCancelButton: true,
      confirmButtonText: 'Guardar y Desbloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a', // Verde éxito
      cancelButtonColor: '#334155',
      background: '#0b162c',
      color: '#fff',
      preConfirm: (value) => {
        if (!value || value.length < 6) {
          Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
        }
        return value;
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const tokenAdmin = localStorage.getItem('token'); 
          const config = {
            headers: {
              Authorization: `Bearer ${tokenAdmin}`
            }
          };

          // Consumimos tu endpoint personalizado del backend usando tu cliente Axios
          const { data } = await clienteAxios.put(
            `/usuarios/admin/generar-password/${usuario.id}`, 
            { nuevaPassword: result.value }, 
            config
          );

          Swal.fire({
            icon: 'success',
            title: '¡Clave Actualizada!',
            text: data.msg || 'La cuenta ha sido restablecida con éxito.',
            background: '#0b162c',
            color: '#fff',
            showConfirmButton: false,
            timer: 2000
          });

          // Recargamos el estado de usuarios global para limpiar la alerta de la pantalla
          if (obtenerUsuarios) {
            obtenerUsuarios();
          } else {
            // Alternativa si tu hook recarga automáticamente o requiere refrescar ventana
            window.location.reload();
          }

        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.msg || 'No se pudo actualizar la contraseña',
            background: '#0b162c',
            color: '#fff',
            confirmButtonColor: '#dc2626'
          });
        }
      }
    });
  };

  const handleCrearDepartamento = async (e) => {
    e.preventDefault();

    const resultado = await crearDepartamento(
      nombreDepartamento
    );

    if (resultado.ok) {
      setNombreDepartamento('');

      Swal.fire({
        title: 'Academia creada',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });

      return;
    }

    Swal.fire({
      title: 'No se pudo crear',
      text: resultado.msg,
      icon: 'error',
      background: '#0b162c',
      color: '#fff',
      confirmButtonColor: '#dc2626',
    });
  };

  const handleEliminarDepartamento = async (id) => {
    const resultado = await Swal.fire({
      title: 'Eliminar academia?',
      text: 'Esta accion no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      await eliminarDepartamento(id);
    }
  };

  const handleRestaurarProyecto = async (id, nombre) => {
    const resultado = await Swal.fire({
      title: '¿Restaurar proyecto?',
      text: `El proyecto "${nombre}" volverá a estar activo para sus investigadores y colaboradores.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      await restaurarProyecto(id);
      Swal.fire({
        title: 'Proyecto restaurado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  const handleEliminarProyectoDefinitivo = async (id, nombre) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar permanentemente?',
      text: `¡Cuidado! Vas a destruir el proyecto "${nombre}". Esta acción es irreversible y borrará el registro por completo de la base de datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar para siempre',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      await eliminarProyectoPermanente(id);
      Swal.fire({
        title: 'Eliminado definitivo',
        text: 'El proyecto ha sido borrado de la base de datos.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  const handleRestaurarEncuesta = async (id, titulo) => {
    const resultado = await Swal.fire({
      title: '¿Restaurar encuesta?',
      text: `La encuesta "${titulo}" volverá a estar disponible para ser respondida.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d', 
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      await restaurarEncuesta(id);
      Swal.fire({
        title: 'Encuesta restaurada',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  const handleEliminarEncuestaDefinitiva = async (id, titulo) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar permanentemente?',
      text: `¡Cuidado! Vas a destruir la encuesta "${titulo}". Se borrarán todas sus preguntas y respuestas de forma irreversible.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar para siempre',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      await eliminarEncuestaPermanente(id);
      Swal.fire({
        title: 'Encuesta eliminada',
        text: 'La encuesta ha sido borrada de la base de datos.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });
    }
  };

  const handleRestaurarUsuario = async (id, nombreComplete) => {
    const resultado = await Swal.fire({
      title: '¿Desbloquear usuario?',
      text: `El usuario "${nombreComplete}" recuperará el acceso total a su cuenta en la plataforma.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, restaurar cuenta',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      const res = await restaurarUsuario(id);
      if (res?.ok) {
        Swal.fire({
          title: 'Usuario reactivado',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#0b162c',
          color: '#fff',
        });
      }
    }
  };

  const handleEliminarUsuarioDefinitivo = async (id, nombreComplete) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar permanentemente?',
      text: `¡Atención! Vas a eliminar de forma definitiva a "${nombreComplete}". Esta acción no se puede deshacer y borrará permanentemente todo su historial de la base de datos.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar para siempre',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      const res = await eliminarUsuarioPermanente(id);
      if (res?.ok) {
        Swal.fire({
          title: 'Usuario purgado',
          text: 'El usuario fue removido completamente del ecosistema.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#0b162c',
          color: '#fff',
        });
      }
    }
  };

  if (loadingUsuarios) {
    return (
      <div className="text-white">
        Cargando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control de acceso"
        title="Administracion"
        description="Gestiona usuarios, roles y permisos del sistema."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="h-11 rounded-2xl bg-red-700 px-5 font-medium text-white transition hover:bg-red-600"
          >
            Nuevo usuario
          </button>
        }
      />

      {/* SECCIÓN DINÁMICA: ALERTAS DE RESTABLECIMIENTO DE CONTRASEÑA */}
      {solicitudesCambio.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-xl backdrop-blur-sm animate-pulse-subtle">
          <h3 className="text-lg font-bold text-amber-500 mb-3 flex items-center gap-2">
            ⚠️ Solicitudes de Recuperación de Contraseña Pendientes
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Los siguientes usuarios reportaron pérdida de contraseña o bloqueo por intentos fallidos. Asigna una clave provisional para reestablecer su acceso.
          </p>
          <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {solicitudesCambio.map((usr) => {
              const fullName = `${usr.nombre} ${usr.primer_apellido}`;
              return (
                <div 
                  key={usr.id} 
                  className="flex flex-col justify-between bg-[#0b162c] border border-white/5 p-4 rounded-2xl gap-4 shadow-md"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{fullName}</p>
                    <p className="text-gray-400 text-xs truncate mb-2">{usr.email}</p>
                    <span className="inline-block text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-medium border border-amber-500/20">
                      Solicita Reinicio
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleCambiarPasswordManual(usr)}
                    className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-amber-950/20"
                  >
                    <FaKey size={11} />
                    Asignar Nueva Clave
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Sección de Tablas Izquierda */}
        <div className="space-y-6">
          {/* Tabla Primaria de Usuarios */}
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <TablaUsuarios
              data={usuarios}
              setModalOpen={setModalOpen}
            />
          </div>

          {/* Papelera de Usuarios Bloqueados */}
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white">Usuarios bloqueados</h3>
              <p className="mt-1 text-sm text-gray-400">
                Cuentas con acceso restringido. Puedes restaurarles el acceso o eliminarlas definitivamente.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4 text-center">Rol</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usuariosBloqueados.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500">
                        No hay usuarios suspendidos en este momento.
                      </td>
                    </tr>
                  ) : (
                    usuariosBloqueados.map((user) => {
                      const fullName = `${user.nombre} ${user.primer_apellido}`;
                      return (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-medium text-white">
                            {fullName}
                          </td>
                          <td className="py-4 px-4 text-gray-300">
                            {user.email}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs border border-red-500/20 text-red-400 font-medium capitalize">
                              {user.rol}
                            </span>
                          </td>
                          <td className="py-4 px-4 flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestaurarUsuario(user.id, fullName)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 transition hover:bg-green-500/20"
                              title="Desbloquear Usuario"
                            >
                              <FaUndo size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarUsuarioDefinitivo(user.id, fullName)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                              title="Eliminar Permanentemente"
                            >
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Papelera de Reciclaje de Proyectos */}
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white">Papelera de proyectos</h3>
              <p className="mt-1 text-sm text-gray-400">
                Proyectos desactivados. Puedes restaurarlos para regresarlos a la sección principal.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4">Proyecto</th>
                    <th className="py-3 px-4">Departamento / Academia</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {proyectosEliminados.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-500">
                        La papelera de proyectos está vacía.
                      </td>
                    </tr>
                  ) : (
                    proyectosEliminados.map((proyecto) => (
                      <tr key={proyecto.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-medium text-white">
                          {proyecto.nombre_proyecto}
                        </td>
                        <td className="py-4 px-4 text-gray-400">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs border border-white/10">
                            {proyecto.departamento || 'No asignado'}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestaurarProyecto(proyecto.id, proyecto.nombre_proyecto)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 transition hover:bg-green-500/20"
                            title="Restaurar Proyecto"
                          >
                            <FaUndo size={12} />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleEliminarProyectoDefinitivo(proyecto.id, proyecto.nombre_proyecto)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                            title="Eliminar Definitivamente"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Papelera de Reciclaje de Encuestas */}
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white">Papelera de encuestas</h3>
              <p className="mt-1 text-sm text-gray-400">
                Encuestas desactivadas. Puedes restaurarlas para regresarlas a las secciones de consulta.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4">Título de la Encuesta</th>
                    <th className="py-3 px-4">Estado Original</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {encuestasEliminadas.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-8 text-center text-gray-500">
                        La papelera de encuestas está vacía.
                      </td>
                    </tr>
                  ) : (
                    encuestasEliminadas.map((encuesta) => (
                      <tr key={encuesta.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-medium text-white">
                          {encuesta.titulo}
                        </td>
                        <td className="py-4 px-4 text-gray-400">
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs border border-white/10">
                            {encuesta.estado}
                          </span>
                        </td>
                        <td className="py-4 px-4 flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestaurarEncuesta(encuesta.id, encuesta.titulo)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 transition hover:bg-green-500/20"
                            title="Restaurar Encuesta"
                          >
                            <FaUndo size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminarEncuestaDefinitiva(encuesta.id, encuesta.titulo)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                            title="Eliminar Definitivamente"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Lateral de Academias */}
        <aside className="h-fit rounded-3xl border border-white/10 bg-[#0b162c] p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              Academia
            </h2>

            <p className="mt-1 text-sm text-gray-400">
              Crea Academia para asignar a proyectos.
            </p>
          </div>

          <form
            onSubmit={handleCrearDepartamento}
            className="flex gap-2"
          >
            <input
              value={nombreDepartamento}
              onChange={(e) =>
                setNombreDepartamento(e.target.value)
              }
              placeholder="Nombre de la Academia"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#0d1b34] px-4 py-3 text-sm text-white outline-none"
            />

            <button
              type="submit"
              className="rounded-2xl bg-red-700 px-4 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Crear
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {departamentos.length === 0 ? (
              <p className="rounded-2xl border border-white/5 bg-[#081120] p-4 text-sm text-gray-500">
                Aun no hay Academias.
              </p>
            ) : (
              departamentos.map((departamento) => (
                <div
                  key={departamento.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#081120] p-4"
                >
                  <p className="text-sm font-medium text-white">
                    {departamento.nombre}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleEliminarDepartamento(departamento.id)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <ModalUsuario
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
      />
    </div>
  );
};

export default Administracion;