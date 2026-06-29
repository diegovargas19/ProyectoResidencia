import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = () => {

    const { auth, cargando } = useAuth();

    if (cargando) return "Cargando...";

    return auth?.id ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
