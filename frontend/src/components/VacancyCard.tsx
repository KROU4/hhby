import { useState } from 'react';
import { motion } from 'framer-motion';
import { Vacancy, Resume } from '../types';
import { Button } from './Button';

interface VacancyCardProps {
  vacancy: Vacancy;
  resumes?: Resume[];
  onApply?: (vacancyId: string, resumeId?: string) => void;
  applied?: boolean;
}

export const VacancyCard = ({ vacancy, resumes = [], onApply, applied }: VacancyCardProps) => {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {vacancy.name}
          </h3>
          <p className="text-gray-600">{vacancy.employer.name}</p>
        </div>
        {vacancy.salary && (
          <div className="text-right ml-4">
            <p className="text-lg font-bold text-primary-500">
              {vacancy.salary.from && `от ${vacancy.salary.from.toLocaleString()}`}
              {vacancy.salary.to && ` до ${vacancy.salary.to.toLocaleString()}`}
              {' '}{vacancy.salary.currency}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <span>📍 {vacancy.area.name}</span>
        <span>📅 {new Date(vacancy.published_at).toLocaleDateString('ru-RU')}</span>
      </div>

      {vacancy.snippet?.requirement && (
        <div className="mb-4">
          <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: vacancy.snippet.requirement }} />
        </div>
      )}

      {resumes.length > 1 && !applied && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите резюме
          </label>
          <select
            className="input"
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
          >
            {resumes.map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => onApply?.(vacancy.id, selectedResumeId)}
          disabled={applied}
          className="flex-1"
        >
          {applied ? '✓ Откликнулись' : 'Откликнуться'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.open(vacancy.alternate_url, '_blank')}
        >
          Открыть на HH
        </Button>
      </div>
    </motion.div>
  );
};
