import React from 'react';
import { MonthlyData } from '../types';

interface BaseDeValoresTableProps {
  data: MonthlyData[];
}

export const BaseDeValoresTable: React.FC<BaseDeValoresTableProps> = ({ data }) => {
  const monthMap: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
    'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Base de Valores</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-medium">Mês de Venda</th>
              <th className="px-6 py-3 font-medium text-right">Venda ML Vitralab</th>
              <th className="px-6 py-3 font-medium text-right">Venda ML Onixlab</th>
              <th className="px-6 py-3 font-medium text-right">Venda ML Nativalab</th>
              <th className="px-6 py-3 font-medium text-right">Soma</th>
              <th className="px-6 py-3 font-medium text-right">Diferença</th>
              <th className="px-6 py-3 font-medium text-right">%</th>
              <th className="px-6 py-3 font-medium">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.map((row, index) => {
              const sum = row.vitralabSales + row.onixlabSales + row.nativalabSales;
              const difference = sum - row.goal;
              
              // Calculate percentage based on previous month (Growth Rate)
              // Formula: (Current Sum - Previous Sum) / Previous Sum
              let percentage: number | null = null;
              if (index > 0) {
                const prevRow = data[index - 1];
                const prevSum = prevRow.vitralabSales + prevRow.onixlabSales + prevRow.nativalabSales;
                if (prevSum !== 0) {
                  percentage = ((sum - prevSum) / prevSum) * 100;
                }
              }
              
              // Determine if month is in the future
              const [monthName, yearStr] = row.month.toLowerCase().split(' ');
              const year = parseInt(yearStr);
              const monthIndex = monthMap[monthName];
              
              let isFuture = false;
              if (!isNaN(year) && monthIndex !== undefined) {
                if (year > currentYear) {
                  isFuture = true;
                } else if (year === currentYear && monthIndex > currentMonth) {
                  isFuture = true;
                }
              }

              return (
                <tr key={row.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white uppercase">{row.month}</td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    R$ {row.vitralabSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    R$ {row.onixlabSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-300">
                    R$ {row.nativalabSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-white font-bold">
                    R$ {sum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${!isFuture ? (difference >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-zinc-600'}`}>
                    {!isFuture ? `R$ ${difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${!isFuture && percentage !== null ? (percentage >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-zinc-600'}`}>
                    {!isFuture && percentage !== null ? `${percentage.toFixed(0)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 italic">
                    {row.notes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
