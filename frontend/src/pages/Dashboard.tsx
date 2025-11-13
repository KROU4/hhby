import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { api } from '../api';
import { Settings } from '../types';
import { Button } from '../components/Button';

export const Dashboard = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [todayStats, setTodayStats] = useState({
    responsesCount: 0,
    viewsCount: 0,
    invitationsCount: 0,
    rejectionsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, statsRes] = await Promise.all([
          api.settings.get(),
          api.analytics.getToday(),
        ]);
        setSettings(settingsRes.data);
        setTodayStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleAutoResponder = async () => {
    if (!settings) return;

    try {
      const updated = await api.settings.update({ enabled: !settings.enabled });
      setSettings(updated.data);
    } catch (error) {
      console.error('Failed to toggle auto-responder:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Откликов сегодня', value: todayStats.responsesCount, icon: '📨', color: 'primary' },
    { label: 'Просмотров', value: todayStats.viewsCount, icon: '👀', color: 'blue' },
    { label: 'Приглашений', value: todayStats.invitationsCount, icon: '✨', color: 'green' },
    { label: 'Отказов', value: todayStats.rejectionsCount, icon: '❌', color: 'red' },
  ];

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Панель управления
        </h1>
        <p className="text-gray-600">
          Управляйте автоматической рассылкой откликов и отслеживайте статистику
        </p>
      </motion.div>

      {/* Auto-responder status */}
      <Card className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Автоматическая рассылка
            </h2>
            <p className="text-gray-600">
              {settings?.enabled ? (
                <span className="text-green-600">✓ Включена</span>
              ) : (
                <span className="text-gray-400">Выключена</span>
              )}
              {settings && (
                <span className="ml-4">
                  Лимит: {todayStats.responsesCount} / {settings.maxResponsesPerDay} откликов/день
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={toggleAutoResponder}
            variant={settings?.enabled ? 'secondary' : 'primary'}
          >
            {settings?.enabled ? 'Выключить' : 'Включить'}
          </Button>
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover={false}>
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Быстрые действия
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="cursor-pointer" onClick={() => window.location.href = '/search'}>
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Поиск вакансий
            </h3>
            <p className="text-gray-600">
              Найдите подходящие вакансии и откликнитесь вручную
            </p>
          </Card>

          <Card className="cursor-pointer" onClick={() => window.location.href = '/settings'}>
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Настройки
            </h3>
            <p className="text-gray-600">
              Настройте фильтры и параметры автоматической рассылки
            </p>
          </Card>

          <Card className="cursor-pointer" onClick={() => window.location.href = '/applications'}>
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              История откликов
            </h3>
            <p className="text-gray-600">
              Просмотрите все отправленные отклики и их статусы
            </p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};
