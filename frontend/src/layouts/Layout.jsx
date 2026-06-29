import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiX } from 'react-icons/fi';
import useAuth from '../hooks/useAuth';

const navItems = (auth) => {
  const items = [
    {
      to: '/app',
      label: auth?.rol === 'admin' ? 'Proyectos' : 'Mis proyectos',
    },
  ];

  if (auth?.rol !== 'colaborador') {
    items.push(
      {
        to: '/app/encuestas',
        label: 'Encuestas',
      },
      {
        to: '/app/dashboard',
        label: 'Dashboard',
      },
      {
        to: '/app/reportes',
        label: 'Reportes',
      }
    );
  }

  if (auth?.rol === 'admin') {
    items.push({
      to: '/app/administracion',
      label: 'Administración',
    });
  }

  return items;
};

const linkBase = 'transition';

const desktopLink = ({ isActive }) =>
  `${linkBase} ${isActive ? 'font-semibold text-white' : 'text-gray-400 hover:text-white'}`;

const mobileLink = ({ isActive }) =>
  `block rounded-lg px-4 py-3 ${
    isActive
      ? 'bg-white/10 font-semibold text-white'
      : 'text-gray-400 hover:bg-white/5 hover:text-white'
  }`;

const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { auth, cerrarSesionAuth } = useAuth();
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    cerrarSesionAuth();

    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#070f1f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#070f1f] backdrop-blur">
        <div className="mx-auto max-w-450 px-6 lg:px-10">
          <div className="flex h-24 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link to="/app" onClick={closeMenu} className="flex items-center gap-2">
                <img
                    src="/img/logo.png"
                    alt="Logo ITSJ"
                    className="h-40 w-auto object-contain"
                  />
              </Link>

              <span className="hidden text-xs font-medium text-gray-400 lg:block">
                Sistema de Gestión de Proyectos
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
              {navItems(auth).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  className={desktopLink}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {auth?.id ? (
                <button
                  onClick={handleLogout}
                  className="hidden items-center rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:inline-flex"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link
                  to="/"
                  className="hidden items-center rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:inline-flex"
                >
                  Iniciar sesión
                </Link>
              )}

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-400 transition hover:text-white md:hidden"
              >
                {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#070f1f] md:hidden">
            <nav className="mx-auto space-y-1 px-6 py-3 text-sm lg:px-10">
              {navItems(auth).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/app'}
                  onClick={closeMenu}
                  className={mobileLink}
                >
                  {item.label}
                </NavLink>
              ))}

              {auth?.id ? (
                <button
                  onClick={() => {
                    handleLogout();
                    closeMenu();
                  }}
                  className="mt-3 block w-full rounded-lg bg-red-500 px-4 py-3 text-center font-medium text-white transition"
                >
                  Cerrar sesión
                </button>
              ) : (
                <Link
                  to="/"
                  onClick={closeMenu}
                  className="mt-3 block rounded-lg bg-red-500 px-4 py-3 text-center font-medium text-white transition"
                >
                  Iniciar sesión
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="w-full flex-1 px-4 py-4 sm:px-6 lg:px-10 2xl:px-12">
        <div className="mx-auto w-full max-w-[1760px]">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="mb-6 mt-2 border-t border-white/10 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ITSJ — Sistema de Gestión de Proyectos Académicas
      </footer>
    </div>
  );
};

export default Layout;
