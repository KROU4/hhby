import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/Card';
import { Pagination } from '../components/Pagination';
import { api } from '../api';
import { JobApplication } from '../types';

export const Applications = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'viewed' | 'invited'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await api.applications.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    const filtered = applications.filter(app => {
      if (filter === 'all') return true;
      return app.status === filter;
    });
    return filtered;
  }, [applications, filter]);

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const handleFilterChange = (newFilter: 'all' | 'sent' | 'viewed' | 'invited') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-500';
      case 'viewed': return 'text-yellow-500';
      case 'invited': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Отправлен';
      case 'viewed': return 'Просмотрен';
      case 'invited': return 'Приглашение';
      case 'rejected': return 'Отказ';
      default: return status;
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
        <h1 className="text-4xl font-bold gradient-text mb-4">
          История откликов
        </h1>
        <p className="text-gray-600">
          Все ваши отклики на вакансии и их статусы
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { key: 'all', label: 'Все', count: applications.length },
          { key: 'sent', label: 'Отправлены', count: applications.filter(a => a.status === 'sent').length },
          { key: 'viewed', label: 'Просмотрены', count: applications.filter(a => a.status === 'viewed').length },
          { key: 'invited', label: 'Приглашения', count: applications.filter(a => a.status === 'invited').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key as any)}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${filter === tab.key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }
            `}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Applications list */}
      {paginatedApplications.length > 0 ? (
        <div>
          <p className="text-gray-600 mb-6">
            Показано {paginatedApplications.length} из {filteredApplications.length} откликов
          </p>
          <div className="space-y-4">
            {paginatedApplications.map((application) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {application.job?.title || 'Вакансия удалена'}
                      </h3>
                      <p className="text-gray-600">{application.job?.company}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-medium ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </p>
                      {application.job?.salary && (
                        <p className="text-sm text-gray-600 mt-1">
                          {application.job.salary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span>📍 {application.job?.location || 'Не указано'}</span>
                    <span>📅 {new Date(application.sentAt).toLocaleDateString('ru-RU')}</span>
                    <span>📄 {application.resume?.title}</span>
                  </div>

                  {application.letterContent && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {application.letterContent}
                      </p>
                    </div>
                  )}

                  {application.job?.url && (
                    <a
                      href={application.job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 text-primary-500 hover:text-primary-600 transition-colors"
                    >
                      Открыть на HH →
                    </a>
                  )}
                </Card>
              </motion.div>
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
            {filter === 'all' ? 'Откликов пока нет' : `Откликов со статусом "${getStatusText(filter)}" нет`}
          </p>
        </div>
      )}
    </div>
  );
};
