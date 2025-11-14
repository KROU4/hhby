import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../api';
import { useToastStore } from '../store/toastStore';

interface SubscriptionData {
  tier: string;
  limits: {
    dailyResponses: number;
    features: {
      basicSearch: boolean;
      history: boolean;
      favorites: boolean;
      analytics: boolean;
      aiGeneration: boolean;
      telegram: boolean;
      priority: boolean;
    };
  };
  pricing: {
    monthly: number;
    annually: number;
  };
  expiresAt: string | null;
  isActive: boolean;
  dailyLimit: {
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: string;
  };
}

interface TierInfo {
  name: string;
  tier: string;
  price: number;
  priceAnnual: number;
  limit: number;
  features: string[];
  color: string;
  icon: string;
  popular?: boolean;
}

const tiers: TierInfo[] = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    priceAnnual: 0,
    limit: 20,
    features: [
      'Базовый поиск вакансий',
      'История просмотров',
      'Избранные вакансии',
      'Базовая аналитика',
    ],
    color: 'from-gray-400 to-gray-600',
    icon: '🆓',
  },
  {
    name: 'Basic',
    tier: 'basic',
    price: 490,
    priceAnnual: 4900,
    limit: 200,
    features: [
      'Все из Free',
      '200 откликов в день',
      'Telegram уведомления',
      'Расширенная аналитика',
    ],
    color: 'from-blue-400 to-blue-600',
    icon: '📘',
  },
  {
    name: 'Pro',
    tier: 'pro',
    price: 990,
    priceAnnual: 9900,
    limit: 500,
    popular: true,
    features: [
      'Все из Basic',
      '500 откликов в день',
      'AI генерация сопроводительных писем',
      'Telegram бот для управления',
      'Приоритетная поддержка',
    ],
    color: 'from-purple-400 to-purple-600',
    icon: '⭐',
  },
  {
    name: 'Ultimate',
    tier: 'ultimate',
    price: 1990,
    priceAnnual: 19900,
    limit: -1,
    features: [
      'Все из Pro',
      'Неограниченные отклики',
      'VIP функции и приоритет',
      'Персональный менеджер',
      'Корпоративные аккаунты',
      'API доступ',
    ],
    color: 'from-yellow-400 to-orange-600',
    icon: '👑',
  },
];

export const Subscription: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');
  const { addToast } = useToastStore();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await api.account.getSubscription();
      setSubscription(response.data);
    } catch (error) {
      addToast('Ошибка загрузки данных подписки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (tier: string) => {
    addToast(
      'Функция оплаты находится в разработке. Скоро будет доступна интеграция с платежными системами!',
      'info'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const usagePercent = subscription?.dailyLimit.limit === -1
    ? 0
    : ((subscription?.dailyLimit.limit - subscription?.dailyLimit.remaining) / subscription?.dailyLimit.limit) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Управление подпиской
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Выберите тарифный план, который подходит именно вам
          </motion.p>
        </div>

        {/* Current Usage */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Текущий план: <span className="text-indigo-600 dark:text-indigo-400 capitalize">{currentTier}</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {subscription.dailyLimit.limit === -1
                    ? 'Неограниченные отклики'
                    : `${subscription.dailyLimit.remaining} из ${subscription.dailyLimit.limit} откликов осталось сегодня`
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Сброс через
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(subscription.dailyLimit.resetAt).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {subscription.dailyLimit.limit !== -1 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    usagePercent > 80
                      ? 'bg-red-500'
                      : usagePercent > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Ежемесячно
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingPeriod === 'annually'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Ежегодно
              <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-bold">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, index) => {
            const isCurrentTier = tier.tier === currentTier;
            const price = billingPeriod === 'monthly' ? tier.price : tier.priceAnnual / 12;
            const annualSavings = tier.price * 12 - tier.priceAnnual;

            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                  tier.popular ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Популярный
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${tier.color}`} />

                <div className="p-6">
                  <div className="text-4xl mb-2">{tier.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>

                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {Math.round(price)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">₽/мес</span>
                    </div>
                    {billingPeriod === 'annually' && tier.price > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Экономия {annualSavings} ₽/год
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      {tier.limit === -1 ? 'Неограниченно' : `${tier.limit} откликов/день`}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg
                          className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(tier.tier)}
                    disabled={isCurrentTier}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      isCurrentTier
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : `bg-gradient-to-r ${tier.color} text-white hover:shadow-lg transform hover:scale-105`
                    }`}
                  >
                    {isCurrentTier ? 'Текущий план' : 'Выбрать план'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Часто задаваемые вопросы
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Как работает дневной лимит откликов?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Лимит обновляется каждый день в полночь по московскому времени. Неиспользованные отклики не переносятся на следующий день.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Могу ли я изменить план в любое время?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Да, вы можете повысить или понизить свой план в любое время. При повышении изменения вступают в силу немедленно.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Какие способы оплаты принимаются?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Мы принимаем банковские карты (Visa, MasterCard, Мир), а также платежи через Stripe и PayPal. Скоро будет добавлена поддержка ЮKassa.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
