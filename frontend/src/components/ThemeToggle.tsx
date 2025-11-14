import { motion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{
          x: theme === 'dark' ? 28 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        {theme === 'dark' ? (
          <span className="text-sm">🌙</span>
        ) : (
          <span className="text-sm">☀️</span>
        )}
      </motion.div>
    </button>
  );
};
