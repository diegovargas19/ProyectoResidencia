import React, { useState } from 'react';
import TablaProyectos from '../components/tablas/TablaProyectos';
import NuevoProyectoModal from '../components/modales/NuevoProyectoModal';
import useProyectos from '../hooks/useProyectos';
import useAuth from '../hooks/useAuth';
import PageHeader from '../components/ui/PageHeader';

const Proyectos = () => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { proyectos, loading, setProyectoEditar } = useProyectos();
  const { auth } = useAuth();

  const handleNuevoProyecto = () => {
    setProyectoEditar(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Gestion de investigacion"
        title={auth?.rol === 'admin' ? 'Proyectos' : 'Mis proyectos'}
        description="Administra proyectos academicos, archivos de evidencia y seguimiento institucional."
        actions={
          <>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proyecto..."
              className="h-11 rounded-2xl border border-white/10 bg-[#0d1b34] px-4 text-sm text-white outline-none md:w-80"
            />

            {auth?.rol === 'admin' && (
              <button
                type="button"
                onClick={handleNuevoProyecto}
                className="h-11 rounded-2xl bg-red-800 px-5 font-medium text-white transition hover:bg-red-700"
              >
                Nuevo proyecto
              </button>
            )}
          </>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-[#0b162c] p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {auth?.rol === 'admin'
              ? 'Proyectos de investigacion'
              : 'Mis proyectos asignados'}
          </h2>
        </div>

        {loading ? (
          <p className="text-white">Cargando...</p>
        ) : (
          <TablaProyectos data={proyectos} search={search} setModalOpen={setModalOpen} />
        )}
      </div>

      <NuevoProyectoModal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Proyectos;
