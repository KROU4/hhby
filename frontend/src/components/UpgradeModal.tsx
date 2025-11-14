import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToastStore } from '../store/toastStore';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'limit_reached' | 'manual' | 'feature_locked';
  lockedFeature?: string;
}

interface LimitInfo {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

interface TierOption {
  name: string;
  tier: string;
  price: number;
  priceAnnual: number;
  limit: number | string;
  features: string[];
  color: string;
  icon: string;
  recommended?: boolean;
}

const tiers: TierOption[] = [
  {
    name: 'Basic',
    tier: 'basic',
    price: 490,
    priceAnnual: 4900,
    limit: 200,
    features: ['200 откликов/день', 'Telegram уведомления', 'Расширенная аналитика'],
    color: 'from-blue-400 to-blue-600',
    icon: '📘',
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 990,
    priceAnnual: 9900,
    limit: 500,
    features: [
      '500 откликов/день',
      'AI генерация писем',
      'Telegram бот',
      'Приоритет',
    ],
    color: 'from-purple-400 to-purple-600',
    icon: '⭐',
    recommended: true,
  },
  {
    name: 'Ultimate',
    tier: 'ultimate',
    price: 1990,
    priceAnnual: 19900,
    limit: 'Неограниченно',
    features: [
      'Неограниченные отклики',
      'VIP функции',
      'Персональный менеджер',
      'API доступ',
    ],
    color: 'from-yellow-400 to-orange-600',
    icon: '👑',
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  reason = 'manual',
  lockedFeature,
}) => {
  const [limits, setLimits] = useState<LimitInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (isOpen && reason === 'limit_reached') {
      loadLimits();
    }
  }, [isOpen, reason]);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const response = await api.account.getLimits();
      setLimits(response.data);
    } catch (error) {
      console.error('Failed to load limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (tier: string) => {
    addToast(
      'Функция оплаты находится в разработке. Скоро будет доступна!',
      'info'
    );
    onClose();
    navigate('/subscription');
  };

  const getTitle = () => {
    switch (reason) {
      case 'limit_reached':
        return '⚠️ Дневной лимит исчерпан';
      case 'feature_locked':
        return `🔒 Требуется подписка`;
      default:
        return '🚀 Улучшите свой план';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'limit_reached':
        return limits
          ? `Вы использовали все ${limits.limit} откликов на сегодня. Обновите тариф для продолжения работы.`
          : 'Вы достигли дневного лимита откликов. Обновите тариф для продолжения работы.';
      case 'feature_locked':
        return `Функция "${lockedFeature}" доступна только на платных тарифах. Выберите подходящий план.`;
      default:
        return 'Выберите тариф, который соответствует вашим потребностям, и получите больше возможностей.';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="p-8 pb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {getTitle()}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {getMessage()}
            </p>

            {/* Limit Info */}
            {reason === 'limit_reached' && limits && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 inline-flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-6 py-3"
              >
                <div className="text-2xl">⏰</div>
                <div className="text-left">
                  <div className="text-sm font-medium text-red-900 dark:text-red-200">
                    Лимит будет обновлен через:
                  </div>
                  <div className="text-lg font-bold text-red-700 dark:text-red-300">
                    {new Date(limits.resetAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="px-8 pb-8">
            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`relative bg-gray-50 dark:bg-gray-900 rounded-xl p-6 ${
                    tier.recommended
                      ? 'ring-2 ring-purple-500 shadow-xl scale-105'
                      : 'shadow-lg'
                  }`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Рекомендуем
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{tier.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </h3>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {tier.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        ₽/мес
                      </span>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {tier.priceAnnual} ₽/год (экономия {tier.price * 12 - tier.priceAnnual} ₽)
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      <span>📊</span>
                      <span>{tier.limit} откликов</span>
                    </div>

                    {tier.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpgrade(tier.tier)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      tier.recommended
                        ? `bg-gradient-to-r ${tier.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105`
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Выбрать {tier.name}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 dark:bg-gray-900 px-8 py-6 rounded-b-2xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>✅</span>
                <span>Отмена в любое время</span>
                <span className="mx-2">•</span>
                <span>💳</span>
                <span>Безопасная оплата</span>
                <span className="mx-2">•</span>
                <span>🔒</span>
                <span>Защита данных</span>
              </div>

              <button
                onClick={onClose}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Может быть позже
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
