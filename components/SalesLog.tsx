
import React from 'react';
import { Sale } from '../types';
import { DocumentIcon } from './Icon';

interface SalesLogProps {
  sales: Sale[];
}

const SalesLog: React.FC<SalesLogProps> = ({ sales }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Today's Sales Log</h3>
      {sales.length > 0 ? (
        <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {sales.map((sale) => (
            <li key={sale.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">{sale.itemName}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {sale.quantity} x {sale.unitPrice.toLocaleString()} KES
                </p>
              </div>
              <p className="font-semibold text-blue-600 dark:text-blue-400 text-lg">
                {sale.total.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-10">
            <DocumentIcon className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No sales recorded for today yet.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Use the chat to add a new sale.</p>
        </div>
      )}
    </div>
  );
};

export default SalesLog;
