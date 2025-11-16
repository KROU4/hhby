import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { useToastStore } from '../store/toastStore';
import { useUpgradeModalStore } from '../store/upgradeModalStore';

interface VacancyData {
  title: string;
  company: string;
  description?: string;
  requirements?: string;
  salary?: string;
  experience?: string;
  schedule?: string;
}

interface AiCoverLetterGeneratorProps {
  vacancy: VacancyData;
  onGenerated?: (letter: string) => void;
  onClose?: () => void;
}

type Style = 'professional' | 'friendly' | 'creative' | 'concise';
type Length = 'short' | 'medium' | 'long';

export const AiCoverLetterGenerator: React.FC<AiCoverLetterGeneratorProps> = ({
  vacancy,
  onGenerated,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [style, setStyle] = useState<Style>('professional');
  const [length, setLength] = useState<Length>('medium');
  const [tokensUsed, setTokensUsed] = useState<number>(0);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);

  const { addToast } = useToastStore();
  const { openModal } = useUpgradeModalStore();

  const styles: { value: Style; label: string; icon: string; description: string }[] = [
    {
      value: 'professional',
      label: 'Профессиональный',
      icon: '💼',
      description: 'Деловой стиль для корпоративных вакансий',
    },
    {
      value: 'friendly',
      label: 'Дружелюбный',
      icon: '😊',
      description: 'Теплый стиль для стартапов и креативных компаний',
    },
    {
      value: 'creative',
      label: 'Креативный',
      icon: '🎨',
      description: 'Оригинальный подход для творческих вакансий',
    },
    {
      value: 'concise',
      label: 'Лаконичный',
      icon: '⚡',
      description: 'Краткое и емкое изложение',
    },
  ];

  const lengths: { value: Length; label: string; words: string }[] = [
    { value: 'short', label: 'Короткое', words: '100-150 слов' },
    { value: 'medium', label: 'Среднее', words: '150-250 слов' },
    { value: 'long', label: 'Длинное', words: '250-350 слов' },
  ];

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGeneratedLetter('');

      const response = await api.ai.generateCoverLetter({
        vacancy,
        options: {
          style,
          length,
          includeSkills: true,
        },
      });

      setGeneratedLetter(response.data.coverLetter);
      setTokensUsed(response.data.meta.tokensUsed);
      setEstimatedCost(response.data.meta.estimatedCost);

      addToast('Сопроводительное письмо успешно сгенерировано!', 'success');
    } catch (error: any) {
      console.error('AI generation error:', error);

      if (error.response?.status === 403) {
        // Feature not available for current subscription
        openModal('feature_locked', 'AI генерация писем');
      } else {
        addToast(
          error.response?.data?.message || 'Ошибка генерации письма. Проверьте настройки API ключа.',
          'error'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = () => {
    if (onGenerated && generatedLetter) {
      onGenerated(generatedLetter);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCopy = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter);
      addToast('Письмо скопировано в буфер обмена', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🤖 AI Генерация сопроводительного письма
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Для вакансии: <span className="font-semibold">{vacancy.title}</span> в {vacancy.company}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
        )}
      </div>

      {/* Style Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Стиль письма
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {styles.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                style === s.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {s.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {s.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Length Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Длина письма
        </label>
        <div className="grid grid-cols-3 gap-3">
          {lengths.map((l) => (
            <button
              key={l.value}
              onClick={() => setLength(l.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                length === l.value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {l.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{l.words}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
          isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            <span>Генерация...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Сгенерировать письмо</span>
          </>
        )}
      </button>

      {/* Generated Letter */}
      <AnimatePresence>
        {generatedLetter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>✅</span>
                  <span>Готовое письмо</span>
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Токенов: {tokensUsed}</span>
                  <span>•</span>
                  <span>~${estimatedCost.toFixed(4)}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">
                  {generatedLetter}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUse}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Использовать это письмо
                </button>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Копировать
                </button>
                <button
                  onClick={() => {
                    setGeneratedLetter('');
                    setTokensUsed(0);
                    setEstimatedCost(0);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Сгенерировать заново
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-1">Совет:</p>
            <p>
              AI генерирует письмо на основе описания вакансии. Вы можете
              отредактировать его после генерации, добавив личные детали и конкретные примеры
              из вашего опыта для большей эффективности.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
