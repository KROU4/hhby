import { motion } from 'framer-motion';
import { Vacancy } from '../types';
import { Button } from './Button';

interface VacancyCardProps {
  vacancy: Vacancy;
  onApply?: (vacancyId: string) => void;
  applied?: boolean;
}

export const VacancyCard = ({ vacancy, onApply, applied }: VacancyCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-dark-50 mb-2">
            {vacancy.name}
          </h3>
          <p className="text-dark-300">{vacancy.employer.name}</p>
        </div>
        {vacancy.salary && (
          <div className="text-right ml-4">
            <p className="text-lg font-bold text-primary-400">
              {vacancy.salary.from && `от ${vacancy.salary.from.toLocaleString()}`}
              {vacancy.salary.to && ` до ${vacancy.salary.to.toLocaleString()}`}
              {' '}{vacancy.salary.currency}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
        <span>📍 {vacancy.area.name}</span>
        <span>📅 {new Date(vacancy.published_at).toLocaleDateString('ru-RU')}</span>
      </div>

      {vacancy.snippet?.requirement && (
        <div className="mb-4">
          <p className="text-sm text-dark-300" dangerouslySetInnerHTML={{ __html: vacancy.snippet.requirement }} />
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={() => onApply?.(vacancy.id)}
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
