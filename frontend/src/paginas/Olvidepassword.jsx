import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import clienteAxios from '../config/clienteAxios';

const OlvidePassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Campo obligatorio',
        text: 'Por favor, escribe tu correo electronico',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#b91c1c',
      });
      return;
    }

    try {
      const { data } = await clienteAxios.post('/usuarios/olvide-password', { email });

      Swal.fire({
        icon: 'success',
        title: 'Solicitud enviada',
        text: data.msg,
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#10b981',
      });
      setEmail('');
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.msg || 'No se pudo procesar la solicitud',
        background: '#0b162c',
        color: '#fff',
        confirmButtonColor: '#b91c1c',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070f1e] p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b162c] p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-2">Recuperar acceso</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Te enviaremos un enlace seguro para restablecer tu contrasena.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/70 mb-2 tracking-wide font-medium">
              Correo electronico
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#091224] px-4 py-3.5 text-white outline-none focus:border-red-500/40 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-red-700 py-3.5 font-medium text-white transition hover:bg-red-600 shadow-lg shadow-red-900/20"
          >
            Enviar instrucciones
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-400 hover:text-white transition">
            Regresar al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OlvidePassword;
