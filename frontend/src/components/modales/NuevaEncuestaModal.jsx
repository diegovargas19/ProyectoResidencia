import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Swal from 'sweetalert2'; // Integrado para alertas estéticas
import {
  FaTimes,
  FaClipboardList,
  FaFolderOpen,
  FaCalendarAlt,
  FaAlignLeft,
  FaSave,
} from 'react-icons/fa';
import useEncuestas from '../../hooks/useEncuestas';
import useProyectos from '../../hooks/useProyectos';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },

  content: {
    position: 'relative',
    inset: 'unset',
    background: '#081120',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '28px',
    padding: '0',
    width: '100%',
    maxWidth: '1150px',
    maxHeight: '90vh',
    overflowX: 'hidden',
    overflowY: 'auto',
    boxShadow: '0 25px 80px rgba(0,0,0,0.45)',
  },
};

const NuevaEncuestaModal = ({isOpen, onRequestClose }) => {
  const { proyectos } = useProyectos();
  const {crearEncuesta, editarEncuesta, encuestaEditar, setEncuestaEditar } = useEncuestas();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    if (encuestaEditar) {
      setTitulo(encuestaEditar.titulo || '');
      setDescripcion(encuestaEditar.descripcion || '');
      setProyecto(encuestaEditar.proyecto_id || '');
      setFechaInicio(encuestaEditar.fecha_inicio || '');
      setFechaFin(encuestaEditar.fecha_fin || '');
      return;
    }

    limpiarFormulario();
  }, [encuestaEditar]);

  const limpiarFormulario = () => {
    setTitulo('');
    setDescripcion('');
    setProyecto('');
    setFechaInicio('');
    setFechaFin('');

    setEncuestaEditar(null);
  };

  const handleClose = () => {
    limpiarFormulario();

    onRequestClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validación de campos obligatorios tradicionales
    if ([titulo, descripcion, proyecto, fechaInicio, fechaFin].includes('')) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Todos los campos son obligatorios para generar la encuesta.',
        icon: 'warning',
        background: '#081120',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    // 2. Ajuste de zonas horarias locales para comparar fechas a medianoche
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicio = new Date(fechaInicio);
    inicio.setMinutes(inicio.getMinutes() + inicio.getTimezoneOffset());
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFin);
    fin.setMinutes(fin.getMinutes() + fin.getTimezoneOffset());
    fin.setHours(0, 0, 0, 0);

    // 3. VALIDACIÓN 1: Prevenir encuestas cuya fecha de cierre ya expiró
    if (fin < hoy) {
      Swal.fire({
        title: 'Fecha de cierre inválida',
        text: 'No puedes habilitar una encuesta con una fecha de cierre anterior al día de hoy.',
        icon: 'error',
        background: '#081120',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    // 4. VALIDACIÓN 2: Evitar que el cierre ocurra antes de la apertura (Coherencia lógica)
    if (fin < inicio) {
      Swal.fire({
        title: 'Inconsistencia en el rango',
        text: 'La fecha de cierre no puede ser previa a la fecha de inicio de la encuesta.',
        icon: 'error',
        background: '#081120',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    const encuesta = {
      titulo,
      descripcion,
      proyecto_id: proyecto,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    if (encuestaEditar?.id) {
      encuesta.id = encuestaEditar.id;

      const respuesta = await editarEncuesta(encuesta);

      if (respuesta.ok) {
        Swal.fire({
          title: 'Encuesta actualizada',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#081120',
          color: '#fff',
        });
        handleClose();
      }

      return;
    }

    const respuesta = await crearEncuesta(encuesta);

    if (respuesta.ok) {
      Swal.fire({
        title: 'Encuesta creada con éxito',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#081120',
        color: '#fff',
      });
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      style={customStyles}
      closeTimeoutMS={200}
      onRequestClose={handleClose}
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-linear-to-r from-blue-600/10 via-cyan-500/5 to-transparent" />

        <div className="relative flex items-start justify-between gap-4 p-8">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/15 shadow-lg shadow-blue-500/10">
              <FaClipboardList className="text-2xl text-blue-400" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white">
                {encuestaEditar ? 'Editar Encuesta' : 'Nueva Encuesta'}
              </h2>

              <p className="mt-2 max-w-md leading-relaxed text-gray-400">
                Configura los datos principales del instrumento de investigación.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 transition hover:border-red-500/20 hover:bg-red-500/15 hover:text-red-400"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {/* Left */}
          <div className="space-y-7">
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <FaClipboardList className="text-blue-400" />
                Título de la encuesta
              </label>

              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ejemplo: Encuesta de satisfacción académica"
                className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-blue-500/40"
              />
            </div>

            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <FaAlignLeft className="text-cyan-400" />
                Descripción
              </label>

              <textarea
                rows={11}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el objetivo de la encuesta..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-500/40"
              />
            </div>
          </div>

          {/* Right */}
          <div className="space-y-7">
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                <FaFolderOpen className="text-yellow-400" />
                Proyecto asociado
              </label>

              <select
                value={proyecto}
                onChange={(e) => setProyecto(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white outline-none transition focus:border-yellow-500/40"
              >
                <option value="">
                  Selecciona un proyecto
                </option>

                {proyectos.map((proyecto) => (
                  <option
                    key={proyecto.id}
                    value={proyecto.id}
                  >
                    {proyecto.nombre_proyecto}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FaCalendarAlt className="text-emerald-400" />
                  Fecha de inicio
                </label>

                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white outline-none transition focus:border-emerald-500/40"
                />
              </div>

              <div>
                <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                  <FaCalendarAlt className="text-red-400" />
                  Fecha de cierre
                </label>

                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d1b34] px-5 py-4 text-white outline-none transition focus:border-red-500/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse items-center justify-end gap-3 pt-8 md:flex-row">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-gray-300 transition hover:bg-white/10 md:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-800 px-7 py-3 font-medium shadow-lg shadow-red-900/20 transition hover:bg-red-700 md:w-auto"
          >
            <FaSave />
            {encuestaEditar ? 'Guardar Cambios' : 'Crear Encuesta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NuevaEncuestaModal;