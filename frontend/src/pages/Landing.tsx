import { motion } from 'framer-motion';
import { Button } from '../components/Button';
import { api } from '../api';

export const Landing = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/30">
              <span className="text-5xl">⚡</span>
            </div>
          </motion.div>

          <h1 className="text-7xl font-bold mb-6">
            <span className="gradient-text">HH Auto-Responder</span>
          </h1>

          <p className="text-2xl text-dark-300 mb-12 max-w-3xl mx-auto font-light">
            Автоматизируйте рассылку откликов на вакансии HH.ru
            <br />
            Найдите работу мечты без лишних усилий
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => api.auth.loginWithHH()}
              className="text-lg px-12 py-4 animate-pulse-glow"
            >
              🚀 Войти через HH.ru
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: '🤖',
              title: 'Автоматические отклики',
              description: 'До 200 откликов в день с умными фильтрами и настройками',
            },
            {
              icon: '🎯',
              title: 'Персонализация',
              description: 'AI генерирует уникальные сопроводительные письма для каждой вакансии',
            },
            {
              icon: '📊',
              title: 'Аналитика',
              description: 'Отслеживайте статистику откликов, приглашения и эффективность',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="card text-center hover:border-primary-500/50"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-dark-50 mb-3">
                {feature.title}
              </h3>
              <p className="text-dark-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
