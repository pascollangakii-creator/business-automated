
import React from 'react';

interface SummaryCardProps {
  title: string;
  value: number;
  currency: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, currency }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        {value.toLocaleString()} <span className="text-xl font-semibold text-slate-400 dark:text-slate-500">{currency}</span>
      </p>
    </div>
  );
};

export default SummaryCard;
