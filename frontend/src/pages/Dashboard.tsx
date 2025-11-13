import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { api } from '../api';
import { Settings } from '../types';
import { Button } from '../components/Button';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  date: string;
  responsesCount: number;
  viewsCount: number;
  invitationsCount: number;
  rejectionsCount: number;
}

export const Dashboard = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [todayStats, setTodayStats] = useState({
    responsesCount: 0,
    viewsCount: 0,
    invitationsCount: 0,
    rejectionsCount: 0,
  });
  const [weeklyData, setWeeklyData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, statsRes, analyticsRes] = await Promise.all([
          api.settings.get(),
          api.analytics.getToday(),
          api.analytics.getRange(7), // последние 7 дней
        ]);
        setSettings(settingsRes.data);
        setTodayStats(statsRes.data);
        setWeeklyData(analyticsRes.data || []);
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

  // График активности за неделю
  const activityChartData = {
    labels: weeklyData.map(d => new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })),
    datasets: [
      {
        label: 'Отклики',
        data: weeklyData.map(d => d.responsesCount),
        borderColor: '#D6001C',
        backgroundColor: 'rgba(214, 0, 28, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Просмотры',
        data: weeklyData.map(d => d.viewsCount),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Приглашения',
        data: weeklyData.map(d => d.invitationsCount),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Воронка конверсии (пончик)
  const totalResponses = weeklyData.reduce((sum, d) => sum + d.responsesCount, 0);
  const totalViews = weeklyData.reduce((sum, d) => sum + d.viewsCount, 0);
  const totalInvitations = weeklyData.reduce((sum, d) => sum + d.invitationsCount, 0);
  const totalRejections = weeklyData.reduce((sum, d) => sum + d.rejectionsCount, 0);

  const conversionData = {
    labels: ['Просмотры', 'Приглашения', 'Отказы', 'Без ответа'],
    datasets: [
      {
        data: [
          totalViews,
          totalInvitations,
          totalRejections,
          Math.max(0, totalResponses - totalViews - totalInvitations - totalRejections),
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#EF4444', '#9CA3AF'],
        borderWidth: 0,
      },
    ],
  };

  const viewRate = totalResponses > 0 ? ((totalViews / totalResponses) * 100).toFixed(1) : '0';
  const inviteRate = totalViews > 0 ? ((totalInvitations / totalViews) * 100).toFixed(1) : '0';

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

      {/* Analytics Charts */}
      {weeklyData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Активность за неделю
              </h3>
              <Line
                data={activityChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </Card>
          </motion.div>

          {/* Conversion Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Конверсия откликов
              </h3>
              <div className="flex items-center justify-center mb-4">
                <Doughnut
                  data={conversionData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                      },
                    },
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Процент просмотров</p>
                  <p className="text-2xl font-bold text-blue-600">{viewRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Процент приглашений</p>
                  <p className="text-2xl font-bold text-green-600">{inviteRate}%</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Быстрые действия
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer" onClick={() => window.location.href = '/search'}>
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Поиск вакансий
            </h3>
            <p className="text-gray-600">
              Найдите подходящие вакансии и откликнитесь вручную
            </p>
          </Card>

          <Card className="cursor-pointer" onClick={() => window.location.href = '/favorites'}>
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Избранное
            </h3>
            <p className="text-gray-600">
              Просмотрите избранные вакансии
            </p>
          </Card>

          <Card className="cursor-pointer" onClick={() => window.location.href = '/history'}>
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              История просмотров
            </h3>
            <p className="text-gray-600">
              Вакансии, которые вы просматривали ранее
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
