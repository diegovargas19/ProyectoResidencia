import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import clienteAxios from '../config/clienteAxios';

const NuevoPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [tokenValido, setTokenValido] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const comprobarToken = async () => {
      try {
        await clienteAxios.get(`/usuarios/olvide-password/${token}`);
        setTokenValido(true);
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Enlace no valido',
          text: error.response?.data?.msg || 'El enlace no es valido o ya expiro',
          background: '#0b162c',
          color: '#fff',
          confirmButtonColor: '#b91c1c',
        });
      } finally {
        setCargando(false);
      }
    };

    comprobarToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Contrasena muy corta',
        text: 'La contrasena debe tener al menos 6 caracteres',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#b91c1c',
      });
      return;
    }

    if (password !== confirmarPassword) {
      Swal.fire({
        icon: 'error',
        title: 'No coinciden',
        text: 'Ambas contrasenas deben ser iguales',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#b91c1c',
      });
      return;
    }

    try {
      setGuardando(true);
      const { data } = await clienteAxios.post(`/usuarios/olvide-password/${token}`, { password });

      Swal.fire({
        icon: 'success',
        title: 'Contrasena actualizada',
        text: data.msg,
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#10b981',
      });

      navigate('/');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.msg || 'No se pudo actualizar la contrasena',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#b91c1c',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070f1e] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b162c] p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Nueva contrasena</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Escribe y confirma tu nueva contrasena para recuperar el acceso.
        </p>

        {cargando ? (
          <p className="text-center text-gray-300">Validando enlace...</p>
        ) : tokenValido ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-white/70 mb-2 tracking-wide font-medium">
                Nueva contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#091224] px-4 py-3.5 text-white outline-none focus:border-red-500/40 transition"
              />
            </div>

            <div>
              <label className="block text-xs text-white/70 mb-2 tracking-wide font-medium">
                Confirmar contrasena
              </label>
              <input
                type="password"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#091224] px-4 py-3.5 text-white outline-none focus:border-red-500/40 transition"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-xl bg-red-700 py-3.5 font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-red-900/20"
            >
              {guardando ? 'Guardando...' : 'Guardar nueva contrasena'}
            </button>
          </form>
        ) : (
          <p className="text-center text-gray-300">
            Solicita un nuevo enlace para poder restablecer tu contrasena.
          </p>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-white transition">
            Regresar al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NuevoPassword;
