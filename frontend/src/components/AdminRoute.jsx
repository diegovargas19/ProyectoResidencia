import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const AdminRoute = () => {
  const { auth, cargando } = useAuth();

  if (cargando) {
    return <div className="p-10 text-white">Cargando...</div>;
  }

  if (auth?.rol !== 'admin') {
    return <Navigate to="/app" />;
  }

  return <Outlet />;
};

export default AdminRoute;
