import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  FaPlus,
  FaSearch,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaChartBar,
} from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import useEncuestas from '../hooks/useEncuestas';
import NuevaEncuestaModal from '../components/modales/NuevaEncuestaModal';
import ToastMensaje from '../components/ui/ToastMensaje';
import TablaEncuestas from '../components/tablas/TablaEncuestas';
import PageHeader from '../components/ui/PageHeader';
import clienteAxios from '../config/clienteAxios'; // 👈 Asegúrate de que esta ruta apunte a tu cliente de Axios

const Encuestas = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  const {
    encuestas,
    eliminarEncuesta,
    loading,
    toast,
    cerrarToast,
    setEncuestaEditar,
  } = useEncuestas();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // 🔗 Función para manejar la creación de los enlaces de un solo uso masivos
  const handleGenerarEnlaces = async (encuestaId) => {
    const { value: cantidad } = await Swal.fire({
      title: 'Generar enlaces de un solo uso',
      input: 'number',
      inputLabel: '¿Cuántos enlaces únicos deseas generar?',
      inputValue: 1,
      showCancelButton: true,
      confirmButtonText: 'Generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
      background: '#0b162c',
      color: '#fff',
      inputAttributes: {
        min: 1,
        max: 100,
        step: 1
      },
      inputValidator: (value) => {
        if (!value || value < 1) {
          return '¡Debes ingresar al menos 1!';
        }
      }
    });

    if (!cantidad) return;

    try {
      const token = localStorage.getItem('token');
      const { data } = await clienteAxios.post(
        `/encuestas/generar-enlace/${encuestaId}`, 
        { cantidad }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // CASO A: Si es un solo link, copiarlo directamente
      if (data.enlaces.length === 1) {
        await navigator.clipboard.writeText(data.enlaces[0]);
        Swal.fire({
          icon: 'success',
          title: '¡Enlace generado!',
          text: 'Se ha copiado 1 enlace único al portapapeles.',
          timer: 2000,
          showConfirmButton: false,
          background: '#0b162c',
          color: '#fff',
        });
      } else {
        // CASO B: Si son múltiples links, unirlos por salto de línea
        const listaTexto = data.enlaces.join('\n');
        
        Swal.fire({
          title: `¡${data.enlaces.length} Enlaces Generados!`,
          background: '#0b162c',
          color: '#fff',
          html: `
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 12px; text-align: left;">
              Cada enlace expira tras recibir su primera respuesta. Copia el bloque inferior para Excel o chats:
            </p>
            <textarea 
              id="lista-enlaces-textarea" 
              readonly 
              style="width: 100%; height: 160px; padding: 12px; border-radius: 12px; background: #0d1b34; color: #f8fafc; font-family: monospace; font-size: 11px; border: 1px solid #334155; resize: none; outline: none;"
              onClick="this.select()"
            >${listaTexto}</textarea>
          `,
          confirmButtonText: 'Copiar todos al portapapeles',
          confirmButtonColor: '#22c55e',
          showCancelButton: true,
          cancelButtonText: 'Cerrar',
          cancelButtonColor: '#334155',
          preConfirm: () => {
            return navigator.clipboard.writeText(listaTexto)
              .then(() => true)
              .catch(() => {
                Swal.showValidationMessage('No se pudo copiar automáticamente.');
                return false;
              });
          }
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              icon: 'success',
              title: '¡Copiados con éxito!',
              text: 'Todos los enlaces están en tu portapapeles listos para ser distribuidos.',
              timer: 2500,
              showConfirmButton: false,
              background: '#0b162c',
              color: '#fff',
            });
          }
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error al generar enlaces',
        text: error.response?.data?.msg || 'Ocurrió un problema en el servidor.',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const encuestasFiltradas = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return encuestas;

    return encuestas.filter((encuesta) =>
      [
        encuesta.titulo,
        encuesta.descripcion,
        encuesta.estado,
        encuesta?.proyecto?.nombre_proyecto,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [search, encuestas]);

  const handleEliminar = async (id) => {
    const resultado = await Swal.fire({
      title: 'Eliminar encuesta?',
      text: 'Esta accion no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0b162c',
      color: '#fff',
    });

    if (resultado.isConfirmed) {
      const respuesta = await eliminarEncuesta(id);

      if (respuesta.ok) {
        Swal.fire({
          title: 'Encuesta eliminada',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#0b162c',
          color: '#fff',
        });
      } else {
        Swal.fire({
          title: 'Error al eliminar',
          text: 'Ocurrio un problema al eliminar la encuesta',
          icon: 'error',
          background: '#0b162c',
          color: '#fff',
          confirmButtonColor: '#dc2626',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400">
        Cargando encuestas...
      </div>
    );
  }

  return (
    <>
      <ToastMensaje
        abierto={toast.abierto}
        tipo={toast.tipo}
        texto={toast.texto}
        onClose={cerrarToast}
      />

      <div className="space-y-6 p-6">
        <PageHeader
          eyebrow="Instrumentos"
          title="Encuestas"
          description="Administracion de instrumentos de recoleccion de datos."
          actions={
            <>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar encuesta..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] py-3 pl-11 pr-4 text-sm outline-none md:w-80"
                />
              </div>

              {auth?.rol === 'admin' && (
                <button
                  onClick={() => {
                    setEncuestaEditar(null);
                    setModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-red-800 px-5 py-3 font-medium transition hover:bg-red-700"
                >
                  <FaPlus />
                  Nueva encuesta
                </button>
              )}
            </>
          }
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15">
              <FaClipboardList className="text-blue-400" />
            </div>

            <h3 className="text-3xl font-bold text-white">
              {encuestas.length}
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Encuestas registradas
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
              <FaCheckCircle className="text-emerald-400" />
            </div>

            <h3 className="text-3xl font-bold text-white">
              {encuestas.filter((e) => e.estado === 'Activa').length}
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Encuestas activas
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/15">
              <FaClock className="text-yellow-400" />
            </div>

            <h3 className="text-3xl font-bold text-white">
              {encuestas.filter((e) => e.estado === 'Borrador').length}
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Encuestas en borrador
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15">
              <FaChartBar className="text-purple-400" />
            </div>

            <h3 className="text-3xl font-bold text-white">
              {encuestas.reduce((acc, item) => acc + (item.respuestas || 0), 0)}
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Respuestas registradas
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0b162c] p-6 shadow-xl">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white">
              Instrumentos de investigacion
            </h2>

            <p className="mt-1 text-gray-400">
              Gestiona encuestas relacionadas con proyectos universitarios.
            </p>
          </div>

          <TablaEncuestas
            data={encuestasFiltradas}
            navigate={navigate}
            handleEliminar={handleEliminar}
            setModalOpen={setModalOpen}
            handleGenerarEnlaces={handleGenerarEnlaces} // 👈 Pasamos la función a la tabla
          />
        </div>
      </div>

      <NuevaEncuestaModal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default Encuestas;
