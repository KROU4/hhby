import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { Card } from '../components/Card';
import { useToastStore } from '../store/toastStore';

interface HistoryItem {
  id: string;
  viewedAt: string;
  job: {
    id: string;
    hhJobId: string;
    title: string;
    company: string;
    salary: string | null;
    location: string | null;
    url: string;
    publishedAt: string;
  };
}

export const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.vacancies.getHistory();
        setHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
        addToast('Не удалось загрузить историю просмотров', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [addToast]);

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
          История просмотров
        </h1>
        <p className="text-gray-600">
          Вакансии, которые вы просматривали ранее
        </p>
      </motion.div>

      {history.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              История пуста
            </h3>
            <p className="text-gray-600 mb-6">
              Вы еще не просматривали ни одной вакансии
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
        <div className="space-y-4">
          {history.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {item.job.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{item.job.company}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {item.job.location && (
                        <span>📍 {item.job.location}</span>
                      )}
                      <span>
                        👁️ Просмотрено: {new Date(item.viewedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    {item.job.salary && (
                      <p className="text-lg font-bold text-primary-500">
                        {item.job.salary}
                      </p>
                    )}
                    <button
                      className="btn btn-secondary text-sm"
                      onClick={() => window.open(item.job.url, '_blank')}
                    >
                      Открыть на HH
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
