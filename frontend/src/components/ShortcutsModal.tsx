import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const ShortcutsModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    window.addEventListener('show-shortcuts-help', handleShow);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('show-shortcuts-help', handleShow);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const shortcuts = [
    { key: 'Ctrl+K', description: 'Перейти к поиску вакансий' },
    { key: 'Alt+1', description: 'Dashboard' },
    { key: 'Alt+2', description: 'Поиск вакансий' },
    { key: 'Alt+3', description: 'История откликов' },
    { key: 'Alt+4', description: 'Статистика работодателей' },
    { key: 'Alt+5', description: 'Избранное' },
    { key: 'Alt+6', description: 'История просмотров' },
    { key: 'Alt+7', description: 'Настройки' },
    { key: '?', description: 'Показать это окно с подсказками' },
    { key: 'Esc', description: 'Закрыть модальное окно' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ⌨️ Горячие клавиши
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </motion.div>
                ))}
              </div>

              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                Нажмите <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">?</kbd> в любой момент, чтобы увидеть эту подсказку
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
