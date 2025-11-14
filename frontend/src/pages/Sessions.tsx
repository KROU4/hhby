import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useToastStore } from '../store/toastStore';

interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: string;
  location?: string;
  createdAt: string;
  lastActivityAt: string;
}

export const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await api.account.getSessions();
      setSessions(response.data);
    } catch (error) {
      addToast('Ошибка загрузки сессий', 'error');
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      await api.account.terminateSession(sessionId);
      addToast('Сессия успешно завершена', 'success');
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      addToast('Ошибка при завершении сессии', 'error');
    }
  };

  const terminateAllSessions = async () => {
    if (!confirm('Вы уверены, что хотите завершить все сессии кроме текущей? Вы будете выйдены из всех других устройств.')) {
      return;
    }

    try {
      const response = await api.account.terminateAllSessions();
      addToast(`Завершено сессий: ${response.data.count}`, 'success');
      loadSessions();
    } catch (error) {
      addToast('Ошибка при завершении сессий', 'error');
    }
  };

  const parseUserAgent = (userAgent: string): { browser: string; os: string; device: string } => {
    const ua = userAgent.toLowerCase();

    // Browser detection
    let browser = '🌐 Неизвестный';
    if (ua.includes('chrome') && !ua.includes('edge')) browser = '🟢 Chrome';
    else if (ua.includes('firefox')) browser = '🦊 Firefox';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = '🧭 Safari';
    else if (ua.includes('edge')) browser = '🔷 Edge';
    else if (ua.includes('opera') || ua.includes('opr')) browser = '🔴 Opera';

    // OS detection
    let os = '💻 Неизвестная ОС';
    if (ua.includes('windows')) os = '🪟 Windows';
    else if (ua.includes('mac')) os = '🍎 macOS';
    else if (ua.includes('linux')) os = '🐧 Linux';
    else if (ua.includes('android')) os = '🤖 Android';
    else if (ua.includes('iphone') || ua.includes('ipad')) os = '📱 iOS';

    // Device type
    let device = '🖥️ Десктоп';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      device = '📱 Мобильный';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = '📱 Планшет';
    }

    return { browser, os, device };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Управление сессиями
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600 dark:text-gray-400 mt-2"
            >
              Активные сессии на всех ваших устройствах
            </motion.p>
          </div>

          {sessions.length > 1 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={terminateAllSessions}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              Завершить все сессии
            </motion.button>
          )}
        </div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8"
        >
          <div className="flex items-start">
            <div className="text-2xl mr-3">🔒</div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Безопасность вашего аккаунта
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Здесь отображаются все активные сессии вашего аккаунта. Если вы видите незнакомое устройство или местоположение,
                немедленно завершите эту сессию и смените пароль.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Нет активных сессий
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                У вас пока нет активных сессий на других устройствах
              </p>
            </motion.div>
          ) : (
            sessions.map((session, index) => {
              const { browser, os, device } = parseUserAgent(session.userAgent);
              const isCurrentSession = index === 0; // Assume first session is current

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${
                    isCurrentSession ? 'ring-2 ring-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {device}
                        </h3>
                        {isCurrentSession && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                            Текущая сессия
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                            <span>{browser}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                            <span>{os}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                            <span>🌍</span>
                            <span>{session.ipAddress}</span>
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                              <span>📍</span>
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Создана:</span>{' '}
                            {formatDate(session.createdAt)}
                          </div>
                          <div>
                            <span className="font-medium">Активность:</span>{' '}
                            {formatDate(session.lastActivityAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      {!isCurrentSession && (
                        <button
                          onClick={() => terminateSession(session.id)}
                          className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors"
                        >
                          Завершить
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Часто задаваемые вопросы
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Что такое сессия?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Сессия создается каждый раз, когда вы входите в систему с нового устройства или браузера.
                Она остается активной до тех пор, пока вы не выйдете или пока не истечет срок действия (30 дней).
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Почему важно проверять активные сессии?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Регулярная проверка активных сессий помогает обнаружить несанкционированный доступ к вашему аккаунту.
                Если вы видите незнакомое устройство, немедленно завершите сессию.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                Что произойдет, если я завершу все сессии?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Вы останетесь авторизованы на текущем устройстве, но будете выйдены из всех остальных устройств.
                Это полезно, если вы подозреваете, что кто-то получил доступ к вашему аккаунту.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
