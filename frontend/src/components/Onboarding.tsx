import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_KEY = 'onboarding-completed';

export const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Show onboarding after a short delay
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const steps = [
    {
      title: 'Добро пожаловать в HH Auto-Responder!',
      description: 'Автоматизируйте поиск работы и отклики на вакансии с HH.ru',
      icon: '👋',
      action: null,
    },
    {
      title: 'Настройте параметры поиска',
      description: 'Укажите желаемую должность, зарплату, город и другие фильтры в разделе "Настройки"',
      icon: '⚙️',
      action: () => navigate('/settings'),
    },
    {
      title: 'Ищите вакансии',
      description: 'Используйте продвинутый поиск вакансий с сохранением истории запросов',
      icon: '🔍',
      action: () => navigate('/search'),
    },
    {
      title: 'Отслеживайте статистику',
      description: 'Смотрите аналитику по откликам, приглашениям и работодателям',
      icon: '📊',
      action: () => navigate('/dashboard'),
    },
    {
      title: 'Горячие клавиши',
      description: 'Нажмите "?" чтобы увидеть все доступные сочетания клавиш. Ctrl+K для быстрого поиска!',
      icon: '⌨️',
      action: null,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  const handleAction = () => {
    const action = steps[currentStep].action;
    if (action) {
      action();
      handleComplete();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Onboarding Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
              {/* Skip button */}
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
              >
                Пропустить
              </button>

              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 flex-1 mx-1 rounded-full transition-colors ${
                        index <= currentStep ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Шаг {currentStep + 1} из {steps.length}
                </p>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center mb-8"
                >
                  <div className="text-6xl mb-6">{steps[currentStep].icon}</div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {steps[currentStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    currentStep === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Назад
                </button>

                <div className="flex gap-3">
                  {steps[currentStep].action && (
                    <button
                      onClick={handleAction}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Перейти
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                  >
                    {currentStep === steps.length - 1 ? 'Начать!' : 'Далее'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
