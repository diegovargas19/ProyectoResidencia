import React from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";

const LayoutProyecto = () => {
  const { id } = useParams();

  const pestañas = [
    { nombre: "Resumen", ruta: "resumen" },
    { nombre: "Investigación", ruta: "investigacion" },
    { nombre: "Archivos", ruta: "archivos" },
    { nombre: "Actividad", ruta: "actividad" },
    { nombre: "Configuración", ruta: "configuracion" },
  ];

  return (
    <div className="p-6 text-white">

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Proyecto</h1>
        <p className="text-white/50 text-sm">
          Panel del proyecto
        </p>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6">
        {pestañas.map(tab => (
          <NavLink
            key={tab.ruta}
            to={`/proyectos/${id}/${tab.ruta}`}
            className={({ isActive }) =>
              `px-4 py-2 rounded-t-lg text-sm transition ${
                isActive
                  ? "bg-red-700 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`
            }
          >
            {tab.nombre}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
};

export default LayoutProyecto;
