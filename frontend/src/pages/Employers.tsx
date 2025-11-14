import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { Card } from '../components/Card';
import { useToastStore } from '../store/toastStore';

interface EmployerStat {
  company: string;
  totalApplications: number;
  totalVacancies: number;
  viewedCount: number;
  invitedCount: number;
  rejectedCount: number;
  viewRate: number;
  inviteRate: number;
  avgResponseTimeDays: number | null;
}

export const Employers = () => {
  const [stats, setStats] = useState<EmployerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'applications' | 'viewRate' | 'inviteRate'>('applications');
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.employers.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch employer stats:', error);
      addToast('Не удалось загрузить статистику работодателей', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sortedStats = [...stats].sort((a, b) => {
    switch (sortBy) {
      case 'applications':
        return b.totalApplications - a.totalApplications;
      case 'viewRate':
        return b.viewRate - a.viewRate;
      case 'inviteRate':
        return b.inviteRate - a.inviteRate;
      default:
        return 0;
    }
  });

  const getRatingEmoji = (rate: number) => {
    if (rate >= 70) return '⭐⭐⭐';
    if (rate >= 40) return '⭐⭐';
    if (rate >= 20) return '⭐';
    return '⚪';
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

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Статистика работодателей
        </h1>
        <p className="text-gray-600">
          Анализ откликов по компаниям и их response rate
        </p>
      </motion.div>

      {stats.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Нет данных
            </h3>
            <p className="text-gray-600 mb-6">
              Отправьте первые отклики, чтобы увидеть статистику
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.href = '/search'}
            >
              Поиск вакансий
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* Sort buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setSortBy('applications')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${sortBy === 'applications'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              По количеству откликов
            </button>
            <button
              onClick={() => setSortBy('viewRate')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${sortBy === 'viewRate'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              По проценту просмотров
            </button>
            <button
              onClick={() => setSortBy('inviteRate')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${sortBy === 'inviteRate'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              По проценту приглашений
            </button>
          </div>

          {/* Stats grid */}
          <div className="space-y-4">
            {sortedStats.map((stat, index) => (
              <motion.div
                key={stat.company}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {stat.company}
                        </h3>
                        <span className="text-2xl" title={`Рейтинг по приглашениям: ${stat.inviteRate}%`}>
                          {getRatingEmoji(stat.inviteRate)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>
                          📨 Отклики: <span className="font-medium text-gray-900">{stat.totalApplications}</span>
                        </span>
                        <span>
                          📋 Вакансии: <span className="font-medium text-gray-900">{stat.totalVacancies}</span>
                        </span>
                        {stat.avgResponseTimeDays && (
                          <span>
                            ⏱️ Ср. ответ: <span className="font-medium text-gray-900">{stat.avgResponseTimeDays} дн.</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Просмотрены</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.viewedCount}</div>
                      <div className="text-xs text-green-600 mt-1">{stat.viewRate.toFixed(1)}%</div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Приглашения</div>
                      <div className="text-2xl font-bold text-primary-500">{stat.invitedCount}</div>
                      <div className="text-xs text-green-600 mt-1">{stat.inviteRate.toFixed(1)}%</div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Отказы</div>
                      <div className="text-2xl font-bold text-gray-900">{stat.rejectedCount}</div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Ожидание</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.totalApplications - stat.viewedCount - stat.rejectedCount}
                      </div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Процент просмотров</span>
                        <span>{stat.viewRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${stat.viewRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Процент приглашений</span>
                        <span>{stat.inviteRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all"
                          style={{ width: `${stat.inviteRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
