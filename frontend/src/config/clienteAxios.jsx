import axios from 'axios';

const clienteAxios = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`
})

clienteAxios.interceptors.response.use(
    response => response,
    error => {
        const esRutaPublicaEncuesta = window.location.pathname.startsWith('/encuestas/enlace/');

        if (error.response?.status === 401 && localStorage.getItem('token') && !esRutaPublicaEncuesta) {
            localStorage.removeItem('token');
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default clienteAxios;
