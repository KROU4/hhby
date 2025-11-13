import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/search', label: 'Поиск вакансий', icon: '🔍' },
    { path: '/applications', label: 'Отклики', icon: '📨' },
    { path: '/settings', label: 'Настройки', icon: '⚙️' },
  ];

  if (!isAuthenticated) return null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-dark-700">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <span className="text-xl font-bold gradient-text">HH Auto</span>
          </Link>

          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative group"
              >
                <span className={`
                  flex items-center gap-2 text-sm font-medium transition-colors
                  ${location.pathname === link.path ? 'text-primary-400' : 'text-dark-300 hover:text-primary-400'}
                `}>
                  <span>{link.icon}</span>
                  {link.label}
                </span>
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-4 left-0 right-0 h-0.5 bg-primary-500"
                  />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-dark-400">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-dark-400 hover:text-primary-400 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
