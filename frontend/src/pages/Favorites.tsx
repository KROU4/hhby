import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { Card } from '../components/Card';
import { useToastStore } from '../store/toastStore';

interface FavoriteItem {
  id: string;
  addedAt: string;
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

export const Favorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((state) => state.addToast);

  const fetchFavorites = async () => {
    try {
      const response = await api.vacancies.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      addToast('Не удалось загрузить избранное', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFromFavorites = async (vacancyId: string) => {
    try {
      await api.vacancies.removeFromFavorites(vacancyId);
      addToast('Удалено из избранного', 'success');
      // Обновляем список
      setFavorites(favorites.filter(item => item.job.hhJobId !== vacancyId));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      addToast('Не удалось удалить из избранного', 'error');
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

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Избранные вакансии
        </h1>
        <p className="text-gray-600">
          Вакансии, которые вы добавили в избранное
        </p>
      </motion.div>

      {favorites.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Избранное пусто
            </h3>
            <p className="text-gray-600 mb-6">
              Добавьте интересные вакансии в избранное, чтобы не потерять их
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
          {favorites.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">
                        {item.job.title}
                      </h3>
                      <button
                        onClick={() => handleRemoveFromFavorites(item.job.hhJobId)}
                        className="text-2xl hover:scale-110 transition-transform"
                        title="Удалить из избранного"
                      >
                        ⭐
                      </button>
                    </div>
                    <p className="text-gray-600 mb-2">{item.job.company}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {item.job.location && (
                        <span>📍 {item.job.location}</span>
                      )}
                      <span>
                        ⭐ Добавлено: {new Date(item.addedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
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
