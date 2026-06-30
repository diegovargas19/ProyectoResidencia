import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthProvider';
import { ProyectosProvider } from './context/ProyectosProvider';
import { EncuestasProvider } from './context/EncuestasProvider';
import { UsuariosProvider } from './context/UsuariosProvider';
import { DepartamentosProvider } from './context/DepartamentosProvider';

import AuthLayout from './layouts/AuthLayout';
import Layout from './layouts/Layout';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Login from './paginas/Login';
import OlvidePassword from './paginas/Olvidepassword';
import NuevoPassword from './paginas/NuevoPassword';

import Proyectos from './paginas/Proyectos';
import Proyecto from './paginas/Proyecto';

import Encuestas from './paginas/Encuestas';
import EncuestaBuilder from './paginas/EncuestaBuilder';
import EncuestaResponder from './paginas/EncuestaResponder';
import EncuestaEnlace from './paginas/EncuestaEnlace';
import EncuestaResultados from './paginas/EncuestaResultados';

import Dashboard from './paginas/Dashboard';
import Administracion from './paginas/Administracion';
import Reportes from './paginas/Reportes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProyectosProvider>
          <EncuestasProvider>
            <UsuariosProvider>
              <DepartamentosProvider>
                <Routes>
                  {/* Público */}
                  <Route element={<AuthLayout />}>
                    <Route path="/" element={<Login />} />
                    <Route path="/olvide-password" element={<OlvidePassword />} />
                    <Route path="/nuevo-password/:token" element={<NuevoPassword />} />
                  </Route>

                  {/* 🔗 RUTA PÚBLICA PARA RESPONDER CON TOKEN MASIVO */}
                  <Route path="/responder/:token" element={<EncuestaEnlace />} />

                  {/* Privado */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<Layout />}>
                      <Route index element={<Proyectos />} />

                      <Route path="proyectos/:id" element={<Proyecto />} />

                      <Route path="encuestas" element={<Encuestas />} />
                      <Route path="encuestas/builder/:id" element={<EncuestaBuilder />} />
                      <Route path="encuestas/responder/:id" element={<EncuestaResponder />} />

                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="reportes" element={<Reportes />} />

                      <Route element={<AdminRoute />}>
                        <Route path="encuestas/resultados/:id" element={<EncuestaResultados />} />
                        <Route path="administracion" element={<Administracion />} />
                      </Route>
                    </Route>
                  </Route>
                </Routes>
              </DepartamentosProvider>
            </UsuariosProvider>
          </EncuestasProvider>
        </ProyectosProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
