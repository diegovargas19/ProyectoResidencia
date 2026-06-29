import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. IMPORTAMOS LINK
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import clienteAxios from '../config/clienteAxios';
import useAuth from '../hooks/useAuth';
import ToastMensaje from '../components/ui/ToastMensaje';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [toast, setToast] = useState({
    abierto: false,
    tipo: 'info',
    texto: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if ([email, password].includes('')) {
      setToast({
        abierto: true,
        tipo: 'error',
        texto: 'Todos los campos son obligatorios',
      });

      return;
    }

    try {
      const { data } = await clienteAxios.post('/usuarios/login', {
        email,
        password,
      });

      localStorage.setItem('token', data.token);
      setAuth(data);

      setToast({
        abierto: true,
        tipo: 'success',
        texto: 'Inicio de sesion exitoso',
      });

      setTimeout(() => {
        navigate('/app');
      }, 800);
    } catch (error) {
      setToast({
        abierto: true,
        tipo: 'error',
        texto: error?.response?.data?.msg || 'Error al iniciar sesion',
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070f1f]">
      <ToastMensaje
        abierto={toast.abierto}
        tipo={toast.tipo}
        texto={toast.texto}
        onClose={() =>
          setToast({
            ...toast,
            abierto: false,
          })
        }
      />

      <div className="absolute inset-0 z-0">
        <img
          src="/img/waves.jpg"
          alt="background"
          className="h-full w-full object-cover opacity-80"
        />
      </div>

      <div className="relative z-10 flex h-150 w-237.5 overflow-hidden rounded-3xl border border-white/20 bg-white/5 shadow-2xl backdrop-blur-2xl">
        <div className="flex w-1/2 flex-col justify-between border-r border-white/20 bg-white/10 p-12 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src="/img/ITSJ.png"
              alt="ITSJ"
              className="h-14 w-18 object-contain"
            />

            <div>
              <h1 className="text-lg font-semibold text-white">
                ITSJ
              </h1>

              <p className="text-sm text-white/70">
                Sistema de Encuestas y Proyectos
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
              <br />
            </h2>

            <p className="text-lg text-white/70">
              Gestiona proyectos academicos, encuestas y reportes desde un
              solo lugar.
            </p>
          </div>

          <p className="text-xs text-white/50">
            (c) {new Date().getFullYear()} ITSJ - Todos los derechos reservados
          </p>
        </div>

        <div className="flex w-1/2 items-center justify-center bg-white text-gray-800">
          <div className="w-3/4">
            <h2 className="mb-2 text-center text-2xl font-semibold">
              Bienvenido
            </h2>

            <p className="mb-6 text-center text-gray-500">
              Ingresa tus credenciales para acceder al sistema
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-gray-600">
                  Correo institucional
                </label>

                <input
                  type="email"
                  placeholder="usuario@tecmm.edu.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">
                  Contrasena
                </label>

                <div className="relative mt-1">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarPassword((prev) => !prev)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-800"
                    aria-label={
                      mostrarPassword
                        ? 'Ocultar contrasena'
                        : 'Mostrar contrasena'
                    }
                  >
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                {/* 2. ENLACE AÑADIDO JUSTO DEBAJO DE LA CONTRASEÑA */}
                <div className="mt-2 text-right">
                  <Link
                    to="/olvide-password"
                    className="text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña o estás bloqueado?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-red-700 py-3 font-medium text-white transition hover:opacity-90 shadow-md"
              >
                Iniciar sesion
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
