import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/search', label: 'Поиск вакансий', icon: '🔍' },
    { path: '/applications', label: 'Отклики', icon: '📨' },
    { path: '/employers', label: 'Работодатели', icon: '🏢' },
    { path: '/favorites', label: 'Избранное', icon: '⭐' },
    { path: '/history', label: 'История', icon: '📖' },
    { path: '/settings', label: 'Настройки', icon: '⚙️' },
  ];

  if (!isAuthenticated) return null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-xl">
              hh
            </div>
            <span className="text-xl font-bold text-gray-900">Auto-Responder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative group"
              >
                <span className={`
                  flex items-center gap-2 text-sm font-medium transition-colors
                  ${location.pathname === link.path ? 'text-primary-500' : 'text-gray-600 hover:text-primary-500'}
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

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-gray-600 dark:text-gray-300">{user?.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
            >
              Выйти
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-primary-500 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 pb-2 space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${location.pathname === link.path
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="text-xl">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}

                <div className="border-t border-gray-200 mt-4 pt-4 px-4">
                  <p className="text-sm text-gray-600 mb-3">{user?.email}</p>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};
