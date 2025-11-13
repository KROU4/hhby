import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { VacancyCard } from '../components/VacancyCard';
import { Pagination } from '../components/Pagination';
import { api } from '../api';
import { Vacancy, Resume } from '../types';
import { useToastStore } from '../store/toastStore';

export const Search = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedVacancies, setAppliedVacancies] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVacancies, setTotalVacancies] = useState(0);
  const { addToast } = useToastStore();

  const itemsPerPage = 10;

  const [filters, setFilters] = useState({
    text: '',
    area: '',
    salary: '',
    experience: '',
    schedule: '',
  });

  useEffect(() => {
    fetchResumes();
    fetchApplications();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.resumes.getAll();
      setResumes(data);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data } = await api.applications.getAll();
      const vacancyIds = new Set(data.map(app => app.job?.hhJobId).filter(Boolean) as string[]);
      setAppliedVacancies(vacancyIds);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const handleSearch = async (page: number = 1) => {
    setLoading(true);
    try {
      const { data } = await api.vacancies.search({
        text: filters.text || undefined,
        area: filters.area || undefined,
        salary: filters.salary ? parseInt(filters.salary) : undefined,
        experience: filters.experience || undefined,
        schedule: filters.schedule || undefined,
        per_page: itemsPerPage,
        page: page - 1, // HH API is 0-indexed
      });
      setVacancies(data.items);
      setTotalVacancies(data.found || 0);
      setTotalPages(Math.ceil((data.found || 0) / itemsPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error('Search failed:', error);
      addToast('Ошибка поиска вакансий', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApply = async (vacancyId: string, resumeId?: string) => {
    if (resumes.length === 0) {
      addToast('Сначала добавьте резюме в настройках!', 'warning');
      return;
    }

    // Используем переданное резюме или первое по умолчанию
    const selectedResumeId = resumeId || resumes[0].id;

    try {
      await api.applications.create({
        vacancyId,
        resumeId: selectedResumeId,
        message: 'Здравствуйте! Я заинтересован в данной вакансии.',
      });
      setAppliedVacancies(prev => new Set([...prev, vacancyId]));
      addToast('Отклик успешно отправлен!', 'success');
    } catch (error: any) {
      addToast(error.response?.data?.error || 'Не удалось отправить отклик', 'error');
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Поиск вакансий
        </h1>
        <p className="text-gray-600">
          Найдите подходящие вакансии и откликнитесь
        </p>
      </motion.div>

      {/* Search filters */}
      <div className="card mb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Должность, компания..."
            value={filters.text}
            onChange={(e) => setFilters({ ...filters, text: e.target.value })}
            label="Поиск"
          />
          <Input
            placeholder="Москва, Санкт-Петербург..."
            value={filters.area}
            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
            label="Город"
          />
          <Input
            type="number"
            placeholder="от 100000"
            value={filters.salary}
            onChange={(e) => setFilters({ ...filters, salary: e.target.value })}
            label="Зарплата (руб)"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Опыт работы
            </label>
            <select
              className="input"
              value={filters.experience}
              onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
            >
              <option value="">Не важно</option>
              <option value="noExperience">Нет опыта</option>
              <option value="between1And3">От 1 до 3 лет</option>
              <option value="between3And6">От 3 до 6 лет</option>
              <option value="moreThan6">Более 6 лет</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              График работы
            </label>
            <select
              className="input"
              value={filters.schedule}
              onChange={(e) => setFilters({ ...filters, schedule: e.target.value })}
            >
              <option value="">Не важно</option>
              <option value="fullDay">Полный день</option>
              <option value="shift">Сменный график</option>
              <option value="flexible">Гибкий график</option>
              <option value="remote">Удаленная работа</option>
            </select>
          </div>
        </div>

        <Button onClick={() => handleSearch(1)} disabled={loading}>
          {loading ? 'Поиск...' : '🔍 Найти вакансии'}
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Поиск вакансий...</p>
        </div>
      ) : vacancies.length > 0 ? (
        <div>
          <p className="text-gray-600 mb-6">
            Найдено вакансий: {totalVacancies.toLocaleString()}
          </p>
          <div className="space-y-6">
            {vacancies.map((vacancy) => (
              <VacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                resumes={resumes}
                onApply={handleApply}
                applied={appliedVacancies.has(vacancy.id)}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">
            Введите параметры поиска и нажмите "Найти вакансии"
          </p>
        </div>
      )}
    </div>
  );
};
