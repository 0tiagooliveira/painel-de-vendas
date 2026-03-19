import React from 'react';
import { MonthlyData } from '../types';
import { TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';

interface DashboardOverviewProps {
  data: MonthlyData;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ data }) => {
  const realized = data.vitralabSales + data.onixlabSales + data.nativalabSales;
  const percentage = data.goal > 0 ? Math.round((realized / data.goal) * 100) : 0;
  
  // Helper to calculate business days (Mon-Fri)
  const getBusinessDays = (startDate: Date, endDate: Date) => {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const today = new Date();
  // Assuming the data.month string format is "Month Year" (e.g., "Março 2026")
  // We need to parse it to get the correct month/year for the selected data
  // However, for simplicity and robustness with the current mock data structure which uses "Month Year" strings,
  // we will try to parse the month from the string or fallback to current date if it matches current month.
  
  // Map Portuguese month names to index
  const monthMap: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
    'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
  };

  let targetDate = new Date();
  const monthName = data.month.split(' ')[0].toLowerCase();
  const year = parseInt(data.month.split(' ')[1]);
  
  if (monthMap[monthName] !== undefined && !isNaN(year)) {
    targetDate = new Date(year, monthMap[monthName], 1);
  }

  const isCurrentMonth = targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear();

  const firstDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const lastDayOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
  
  // Calculate total business days in the month
  const totalBusinessDays = getBusinessDays(firstDayOfMonth, lastDayOfMonth);

  // Calculate business days elapsed
  let businessDaysElapsed = 0;
  if (isCurrentMonth) {
    // If it's the current month, count from start of month to yesterday (completed days) or today
    // Let's count up to today for "elapsed"
    businessDaysElapsed = getBusinessDays(firstDayOfMonth, today);
  } else if (targetDate < today) {
    // Past month
    businessDaysElapsed = totalBusinessDays;
  } else {
    // Future month
    businessDaysElapsed = 0;
  }

  const dailyAverage = businessDaysElapsed > 0 ? Math.round(realized / businessDaysElapsed) : 0;
  
  // Projection: (Average * Total Business Days)
  // If month is over, projection is just the realized value
  const projected = isCurrentMonth 
    ? Math.round(dailyAverage * totalBusinessDays) 
    : realized;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Vendas Totais</h3>
          <DollarSign className="text-emerald-500 w-5 h-5" />
        </div>
        <div className="text-3xl font-bold text-white">
          R$ {realized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-zinc-500 mt-2">
          Média Diária (Útil): R$ {dailyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Meta Mensal</h3>
          <Target className="text-blue-500 w-5 h-5" />
        </div>
        <div className="text-3xl font-bold text-white">
          R$ {data.goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-zinc-500 mt-2">
          Projeção: R$ {projected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Progresso</h3>
          <TrendingUp className={`w-5 h-5 ${percentage >= 100 ? 'text-emerald-500' : 'text-yellow-500'}`} />
        </div>
        <div className="text-3xl font-bold text-white">
          {percentage}%
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3">
          <div 
            className={`h-1.5 rounded-full ${percentage >= 100 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Tempo Decorrido</h3>
          <Calendar className="text-purple-500 w-5 h-5" />
        </div>
        <div className="text-3xl font-bold text-white">
          {businessDaysElapsed} <span className="text-lg text-zinc-500 font-normal">/ {totalBusinessDays} dias úteis</span>
        </div>
        <div className="text-xs text-zinc-500 mt-2">
          {Math.round((businessDaysElapsed / totalBusinessDays) * 100)}% do mês (útil)
        </div>
      </div>
    </div>
  );
};
