import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { api } from '../api';
import { Settings as SettingsType, Resume } from '../types';
import { useToastStore } from '../store/toastStore';

export const Settings = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const [formData, setFormData] = useState({
    enabled: false,
    maxResponsesPerDay: 200,
    coverLetterTemplate: '',
    searchText: '',
    searchArea: '',
    searchSalary: '',
    excludeKeywords: '',
    blacklistEmployers: '',
    scheduleEnabled: false,
    scheduleTime: '09:00',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, resumesRes] = await Promise.all([
        api.settings.get(),
        api.resumes.getAll(),
      ]);

      setSettings(settingsRes.data);
      setResumes(resumesRes.data);

      setFormData({
        enabled: settingsRes.data.enabled,
        maxResponsesPerDay: settingsRes.data.maxResponsesPerDay,
        coverLetterTemplate: settingsRes.data.coverLetterTemplate || '',
        searchText: settingsRes.data.searchFilters?.text || '',
        searchArea: settingsRes.data.searchFilters?.area || '',
        searchSalary: settingsRes.data.searchFilters?.salary?.toString() || '',
        excludeKeywords: settingsRes.data.excludeKeywords?.join(', ') || '',
        blacklistEmployers: settingsRes.data.blacklistEmployers?.join(', ') || '',
        scheduleEnabled: settingsRes.data.scheduleEnabled || false,
        scheduleTime: settingsRes.data.scheduleTime || '09:00',
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      addToast('Не удалось загрузить настройки', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.update({
        enabled: formData.enabled,
        maxResponsesPerDay: formData.maxResponsesPerDay,
        coverLetterTemplate: formData.coverLetterTemplate,
        searchFilters: {
          text: formData.searchText || undefined,
          area: formData.searchArea || undefined,
          salary: formData.searchSalary ? parseInt(formData.searchSalary) : undefined,
        },
        excludeKeywords: formData.excludeKeywords
          ? formData.excludeKeywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
        blacklistEmployers: formData.blacklistEmployers
          ? formData.blacklistEmployers.split(',').map(k => k.trim()).filter(Boolean)
          : [],
        scheduleEnabled: formData.scheduleEnabled,
        scheduleTime: formData.scheduleTime,
      });

      addToast('Настройки успешно сохранены!', 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to save settings:', error);
      addToast('Ошибка при сохранении настроек', 'error');
    } finally {
      setSaving(false);
    }
  };

  const syncResumes = async () => {
    try {
      const { data } = await api.resumes.getAll();
      setResumes(data);
      addToast('Резюме успешно синхронизированы!', 'success');
    } catch (error) {
      console.error('Failed to sync resumes:', error);
      addToast('Ошибка синхронизации резюме', 'error');
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
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Настройки
        </h1>
        <p className="text-gray-600">
          Настройте параметры автоматической рассылки откликов
        </p>
      </motion.div>

      {/* Resumes */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Резюме
          </h2>
          <Button variant="secondary" onClick={syncResumes}>
            Синхронизировать с HH
          </Button>
        </div>

        {resumes.length > 0 ? (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="text-gray-900 font-medium">{resume.title}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Обновлено: {new Date(resume.updatedAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            Резюме не найдены. Создайте резюме на HH.ru и синхронизируйте.
          </p>
        )}
      </Card>

      {/* Auto-responder settings */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Автоматическая рассылка
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-gray-900 font-medium">Включить автоматические отклики</p>
              <p className="text-sm text-gray-600 mt-1">
                Бот будет автоматически откликаться на подходящие вакансии
              </p>
            </div>
            <button
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={`
                relative w-14 h-8 rounded-full transition-colors
                ${formData.enabled ? 'bg-primary-500' : 'bg-gray-300'}
              `}
            >
              <div
                className={`
                  absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                  ${formData.enabled ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <Input
            type="number"
            label="Максимум откликов в день"
            value={formData.maxResponsesPerDay}
            onChange={(e) => setFormData({ ...formData, maxResponsesPerDay: parseInt(e.target.value) })}
            min={1}
            max={500}
          />

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-gray-900 font-medium">Расписание откликов</p>
              <p className="text-sm text-gray-600 mt-1">
                Отправлять отклики только в определенное время
              </p>
            </div>
            <button
              onClick={() => setFormData({ ...formData, scheduleEnabled: !formData.scheduleEnabled })}
              className={`
                relative w-14 h-8 rounded-full transition-colors
                ${formData.scheduleEnabled ? 'bg-primary-500' : 'bg-gray-300'}
              `}
            >
              <div
                className={`
                  absolute top-1 w-6 h-6 bg-white rounded-full transition-transform
                  ${formData.scheduleEnabled ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {formData.scheduleEnabled && (
            <div className="pl-4">
              <Input
                type="time"
                label="Время отправки откликов"
                value={formData.scheduleTime}
                onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-2">
                Отклики будут отправляться ежедневно в указанное время
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Search filters */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Фильтры поиска
        </h2>

        <div className="space-y-4">
          <Input
            label="Поисковый запрос"
            placeholder="Frontend разработчик, React, JavaScript..."
            value={formData.searchText}
            onChange={(e) => setFormData({ ...formData, searchText: e.target.value })}
          />

          <Input
            label="Город"
            placeholder="Москва, Санкт-Петербург..."
            value={formData.searchArea}
            onChange={(e) => setFormData({ ...formData, searchArea: e.target.value })}
          />

          <Input
            type="number"
            label="Минимальная зарплата (руб)"
            placeholder="100000"
            value={formData.searchSalary}
            onChange={(e) => setFormData({ ...formData, searchSalary: e.target.value })}
          />

          <Input
            label="Исключить слова (через запятую)"
            placeholder="агент, вахта, переезд..."
            value={formData.excludeKeywords}
            onChange={(e) => setFormData({ ...formData, excludeKeywords: e.target.value })}
          />

          <Input
            label="Черный список работодателей (через запятую)"
            placeholder="Компания 1, Компания 2..."
            value={formData.blacklistEmployers}
            onChange={(e) => setFormData({ ...formData, blacklistEmployers: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Вакансии от этих работодателей будут автоматически игнорироваться
          </p>
        </div>
      </Card>

      {/* Cover letter */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Сопроводительное письмо
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          Доступные переменные: {'{название вакансии}'}, {'{компания}'}, {'{зарплата}'}
        </p>

        <textarea
          className="input min-h-[200px] resize-none"
          placeholder="Здравствуйте! Меня заинтересовала вакансия {название вакансии} в компании {компания}..."
          value={formData.coverLetterTemplate}
          onChange={(e) => setFormData({ ...formData, coverLetterTemplate: e.target.value })}
        />
      </Card>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Сохранение...' : '💾 Сохранить настройки'}
      </Button>
    </div>
  );
};
