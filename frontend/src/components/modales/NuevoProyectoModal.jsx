import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import Select from 'react-select';
import Swal from 'sweetalert2';

import { ClipboardList } from 'lucide-react';

import useProyectos from '../../hooks/useProyectos';
import useUsuarios from '../../hooks/useUsuarios';
import useDepartamentos from '../../hooks/useDepartamentos';

Modal.setAppElement('#root');

const estados = [
  'Pendiente',
  'En progreso',
  'Completado',
];

const prioridades = [
  'Alta',
  'Media',
  'Baja',
];

const inputStyle =
  'w-full rounded-lg border border-white/10 bg-[#0f1c38]/80 px-3 py-2 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/40';

const labelStyle =
  'mb-1 block text-xs tracking-wide text-white/70';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#0f1c38',
    borderColor: state.isFocused
      ? '#dc2626'
      : 'rgba(255,255,255,0.1)',
    boxShadow: state.isFocused
      ? '0 0 0 2px rgba(220,38,38,.35)'
      : 'none',
    borderRadius: '0.5rem',
    minHeight: '44px',
    transition: 'all .2s ease',

    '&:hover': {
      borderColor: '#dc2626',
    },
  }),

  menu: (provided) => ({
    ...provided,
    backgroundColor: '#0b162c',
    border:
      '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    borderRadius: '0.75rem',
    zIndex: 9999,
  }),

  menuList: (provided) => ({
    ...provided,
    maxHeight: '220px',
    padding: 4,
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? '#122044'
      : 'transparent',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    marginBottom: 2,
  }),

  singleValue: (provided) => ({
    ...provided,
    color: 'white',
  }),

  placeholder: (provided) => ({
    ...provided,
    color: 'rgba(255,255,255,.4)',
  }),

  input: (provided) => ({
    ...provided,
    color: 'white',
  }),

  dropdownIndicator: (provided) => ({
    ...provided,
    color: 'rgba(255,255,255,.5)',

    '&:hover': {
      color: 'white',
    },
  }),

  indicatorSeparator: () => ({
    display: 'none',
  }),

  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'rgba(220,38,38,.18)',
    borderRadius: '0.5rem',
  }),

  multiValueLabel: (provided) => ({
    ...provided,
    color: '#fecaca',
  }),

  multiValueRemove: (provided) => ({
    ...provided,
    color: '#fecaca',

    '&:hover': {
      backgroundColor: 'rgba(220,38,38,.35)',
      color: 'white',
    },
  }),
};

const initialState = {
  nombre_proyecto: '',
  investigador_id: '',
  investigador_ids: [],
  departamento: '',
  estado: 'Pendiente',
  prioridad: 'Media',
  fecha_limite: '',
  colaborador_ids: [],
};

const NuevoProyectoModal = ({isOpen, onRequestClose }) => {
  const {
    crearProyecto,
    proyectoEditar,
    setProyectoEditar,
    editarProyecto,
  } = useProyectos();

  const { usuarios: usuariosBD } = useUsuarios();
  const { departamentos } = useDepartamentos();

  const [formulario, setFormulario] =
    useState(initialState);

  const investigadores = usuariosBD.filter(
    (usuario) => usuario.rol === 'investigador'
  );
  const investigadoresOptions = investigadores.map((usuario) => ({
    value: usuario.id,
    label: [
      usuario.nombre,
      usuario.primer_apellido,
      usuario.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' '),
  }));
  const colaboradoresOptions = usuariosBD
    .filter((usuario) => usuario.rol === 'colaborador')
    .map((usuario) => ({
      value: usuario.id,
      label: [
        usuario.nombre,
        usuario.primer_apellido,
        usuario.segundo_apellido,
      ]
        .filter(Boolean)
        .join(' '),
    }));

  const departamentosOptions = departamentos.map((dep) => ({
    value: dep.nombre,
    label: dep.nombre,
  }));

  useEffect(() => {
    if (proyectoEditar) {
      setFormulario({
        ...initialState,
        ...proyectoEditar,
        investigador_ids:
          proyectoEditar.investigadores?.map((investigador) =>
            Number(investigador.id)
          ) ||
          (proyectoEditar.investigador_id
            ? [Number(proyectoEditar.investigador_id)]
            : []),
        colaborador_ids:
          proyectoEditar.colaboradores?.map((colaborador) =>
            Number(colaborador.id)
          ) || [],
      });

      return;
    }

    setFormulario(initialState);
  }, [proyectoEditar]);

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const handleInvestigadores = (selected) => {
    const investigadorIds = selected.map((option) => option.value);

    setFormulario({
      ...formulario,
      investigador_ids: investigadorIds,
      investigador_id: investigadorIds[0] || '',
    });
  };

  const handleDepartamento = (selected) => {
    setFormulario({
      ...formulario,
      departamento: selected?.value || '',
    });
  };

  const handleColaboradores = (selected) => {
    setFormulario({
      ...formulario,
      colaborador_ids: selected.map((option) => option.value),
    });
  };

  const handleClose = () => {
    setProyectoEditar(null);

    onRequestClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Campos obligatorios tradicionales
    if (
      [
        formulario.nombre_proyecto,
        formulario.departamento,
        formulario.estado,
        formulario.prioridad,
        formulario.fecha_limite,
      ].includes('')
      || formulario.investigador_ids.length === 0
    ) {
      Swal.fire({
        title: 'Todos los campos son obligatorios',
        text: 'Por favor, introduce una fecha límite válida.',
        icon: 'warning',
        background: '#0b162c',
        color: '#fff',
      });

      return;
    }

    // 2. VALIDACIÓN TEMPORAL: Prevenir fechas anteriores al día actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Ajustamos a medianoche para comparar solo días enteros

    const fechaSeleccionada = new Date(formulario.fecha_limite);
    // Compensa los desfases de zona horaria del string de los inputs tipo date
    fechaSeleccionada.setMinutes(fechaSeleccionada.getMinutes() + fechaSeleccionada.getTimezoneOffset());
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      Swal.fire({
        title: 'Fecha límite inválida',
        text: 'No puedes capturar ni guardar un proyecto con una fecha límite anterior al día de hoy.',
        icon: 'error',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#dc2626',
      });
      
      return; // Bloquea el flujo del envío
    }

    let resultado;

    if (proyectoEditar?.id) {
      resultado = await editarProyecto(
        formulario
      );
    } else {
      resultado = await crearProyecto(
        formulario
      );
    }

    if (resultado.ok) {
      Swal.fire({
        title: proyectoEditar
          ? 'Proyecto actualizado'
          : 'Proyecto creado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0b162c',
        color: '#fff',
      });

      handleClose();

      return;
    }

    Swal.fire({
      title: resultado.msg || 'No se pudo guardar el proyecto',
      icon: 'error',
      background: '#0b162c',
      color: '#fff',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      closeTimeoutMS={200}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-linear-to-br from-[#0b162c] to-[#0a1330] p-8 shadow-[0_0_40px_rgba(0,0,0,0.6)] outline-none animate-[fadeIn_.25s_ease]"
    >
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="rounded-lg bg-red-700/20 p-2">
          <ClipboardList
            className="text-red-500"
            size={22}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold tracking-wide text-white">
            {proyectoEditar
              ? 'Editar Proyecto'
              : 'Nuevo Proyecto'}
          </h2>

          <p className="text-xs text-white/50">
            Completa la información requerida
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        className="space-y-4"
        onSubmit={handleSubmit}
      >
        {/* Título */}
        <div>
          <label className={labelStyle}>
            Título
          </label>

          <input
            name="nombre_proyecto"
            value={formulario.nombre_proyecto}
            onChange={handleChange}
            placeholder="Ej. Sistema de gestión universitaria"
            className={inputStyle}
          />
        </div>

        {/* Investigador */}
        <div>
          <label className={labelStyle}>
            Investigadores
          </label>

          <Select
            isMulti
            isSearchable
            options={investigadoresOptions}
            styles={customSelectStyles}
            placeholder="Selecciona investigadores..."
            value={investigadoresOptions.filter((option) =>
              formulario.investigador_ids.includes(option.value)
            )}
            onChange={handleInvestigadores}
          />
        </div>

        {/* Departamento */}
        <div>
          <label className={labelStyle}>
            Departamento
          </label>

          <Select
            isSearchable
            options={departamentosOptions}
            styles={customSelectStyles}
            placeholder="Selecciona un departamento..."
            value={departamentosOptions.find(
              (option) =>
                option.value ===
                formulario.departamento
            )}
            onChange={handleDepartamento}
          />
        </div>

        {/* Colaboradores */}
        <div>
          <label className={labelStyle}>
            Colaboradores
          </label>

          <Select
            isMulti
            isSearchable
            options={colaboradoresOptions}
            styles={customSelectStyles}
            placeholder="Selecciona colaboradores..."
            value={colaboradoresOptions.filter((option) =>
              formulario.colaborador_ids.includes(option.value)
            )}
            onChange={handleColaboradores}
          />

          <p className="mt-1 text-xs text-white/40">
            {formulario.colaborador_ids.length} colaboradores asignados
          </p>
        </div>

        {/* Estado + Prioridad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyle}>
              Estado
            </label>

            <select
              name="estado"
              value={formulario.estado}
              onChange={handleChange}
              className={inputStyle}
            >
              {estados.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelStyle}>
              Prioridad
            </label>

            <select
              name="prioridad"
              value={formulario.prioridad}
              onChange={handleChange}
              className={inputStyle}
            >
              {prioridades.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label className={labelStyle}>
            Fecha límite
          </label>

          <input
            type="date"
            name="fecha_limite"
            value={formulario.fecha_limite || ''}
            onChange={handleChange}
            className={inputStyle}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-white/5 px-4 py-2 text-white transition-all hover:bg-white/10"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="rounded-lg bg-linear-to-r from-red-700 to-red-600 px-5 py-2 font-semibold tracking-wide text-white shadow-lg shadow-red-900/40 transition-all hover:from-red-600 hover:to-red-500 active:scale-95"
          >
            {proyectoEditar
              ? 'Guardar Cambios'
              : 'Guardar Proyecto'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NuevoProyectoModal;