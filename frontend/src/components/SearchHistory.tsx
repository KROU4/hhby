import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToastStore } from '../store/toastStore';

interface SearchHistoryProps {
  onApplySearch: (filters: {
    text?: string;
    area?: string;
    salary?: string;
    experience?: string;
    schedule?: string;
  }) => void;
}

export const SearchHistory = ({ onApplySearch }: SearchHistoryProps) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await api.search.getHistory(5);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSearch = async (item: any) => {
    onApplySearch({
      text: item.text || '',
      area: item.area || '',
      salary: item.salary?.toString() || '',
      experience: item.experience || '',
      schedule: item.schedule || '',
    });
    setShowHistory(false);
    addToast('Поиск восстановлен из истории', 'success');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.search.deleteHistory(id);
      setHistory(history.filter(h => h.id !== id));
      addToast('Удалено из истории', 'success');
    } catch (error) {
      addToast('Не удалось удалить из истории', 'error');
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-primary-500 transition-colors"
      >
        <span>📖</span>
        <span>История поиска ({history.length})</span>
        <span className="text-xs">{showHistory ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-w-2xl"
          >
            <div className="p-2">
              {history.map((item, index) => {
                const searchLabel = [
                  item.text && `"${item.text}"`,
                  item.area && `📍 ${item.area}`,
                  item.salary && `💰 от ${item.salary.toLocaleString()}`,
                  item.experience && `⏱️ ${item.experience}`,
                ].filter(Boolean).join(', ') || 'Пустой поиск';

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleUseSearch(item)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {searchLabel}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Использован {item.useCount} раз
                        {item.resultCount && ` · ${item.resultCount} вакансий`}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="ml-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
