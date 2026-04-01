import React from 'react';
import { MonthlyData } from '../types';

interface CommissionDashboardProps {
  data: MonthlyData;
}

const CommissionDashboard: React.FC<CommissionDashboardProps> = ({ data }) => {
  // --- Business Logic ---
  const totalSales = data.vitralabSales + data.onixlabSales + data.nativalabSales;
  
  // Commission Calculation
  // 1. Mercado Livre takes 19.96%
  const mlFee = totalSales * 0.1996;
  // 2. Remaining value
  const remainingAfterFee = totalSales - mlFee;
  // 3. Commission is 0.5% of the remaining value
  const commission = remainingAfterFee * 0.005;

  // --- Date & Goal Logic ---
  // Helper to get business days (Mon-Fri) in a month
  const getBusinessDaysInMonth = (monthStr: string) => {
    const [monthName, yearStr] = monthStr.toLowerCase().split(' ');
    const year = parseInt(yearStr);
    
    const monthMap: { [key: string]: number } = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    const monthIndex = monthMap[monthName];
    if (isNaN(year) || monthIndex === undefined) return 22; // Default fallback

    const date = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    let businessDays = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const current = new Date(year, monthIndex, i);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sun, 6 = Sat
        businessDays++;
      }
    }
    return businessDays;
  };

  // Helper to get elapsed business days
  const getElapsedBusinessDays = (monthStr: string) => {
    const [monthName, yearStr] = monthStr.toLowerCase().split(' ');
    const year = parseInt(yearStr);
    
    const monthMap: { [key: string]: number } = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3, 'maio': 4, 'junho': 5,
      'julho': 6, 'agosto': 7, 'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    
    const monthIndex = monthMap[monthName];
    if (isNaN(year) || monthIndex === undefined) return 0;

    const now = new Date();
    // If future month, 0 elapsed
    if (year > now.getFullYear() || (year === now.getFullYear() && monthIndex > now.getMonth())) {
      return 0;
    }
    
    // If past month, all business days elapsed
    if (year < now.getFullYear() || (year === now.getFullYear() && monthIndex < now.getMonth())) {
      return getBusinessDaysInMonth(monthStr);
    }

    // Current month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const today = now.getDate();
    // Use the lesser of today or daysInMonth (just in case)
    const limitDay = Math.min(today, daysInMonth);
    
    let elapsed = 0;
    for (let i = 1; i <= limitDay; i++) {
      const current = new Date(year, monthIndex, i);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        elapsed++;
      }
    }
    return elapsed;
  };

  const totalBusinessDays = getBusinessDaysInMonth(data.month);
  const elapsedBusinessDays = getElapsedBusinessDays(data.month);

  // Goal Breakdown
  // Daily Goal = Monthly Goal / Total Business Days
  const dailyGoal = totalBusinessDays > 0 ? data.goal / totalBusinessDays : 0;
  // Weekly Goal = Monthly Goal / 4.33 (Standard commercial weeks per month)
  const weeklyGoal = data.goal / 4.33;

  const remainingGoal = data.goal - totalSales;
  const percentageAchieved = data.goal > 0 ? (totalSales / data.goal) * 100 : 0;

  // Projection
  // User request: "Projeção realizado multiplicado pela meta diaria"
  // Interpreted as: Elapsed Business Days * Daily Goal (Target to Date)
  const projection = elapsedBusinessDays * dailyGoal;
  
  // User request: "FALTA = Valor realizado - projeção"
  const difference = totalSales - projection;

  return (
    <div className="bg-black text-white p-6 rounded-xl border border-zinc-800 shadow-lg mb-8">
      {/* Top Section: Days & Realized (Days Elapsed) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-black border border-zinc-700 rounded-tl-lg">
          <div className="bg-white text-black text-center font-bold py-1 uppercase text-sm tracking-wider">
            DIAS
          </div>
          <div className="text-center py-2 text-xl font-mono">
            {totalBusinessDays}
          </div>
        </div>
        <div className="bg-black border border-zinc-700 rounded-tr-lg">
          <div className="bg-white text-black text-center font-bold py-1 uppercase text-sm tracking-wider">
            REALIZADO
          </div>
          <div className="text-center py-2 text-xl font-mono">
            {elapsedBusinessDays}
          </div>
        </div>
      </div>

      {/* Middle Section: Commission */}
      <div className="mb-8 flex justify-center">
        <div className="w-full max-w-md bg-black border border-zinc-700 rounded-lg">
          <div className="bg-white text-black text-center font-bold py-2 uppercase text-lg tracking-wider">
            COMISSAO
          </div>
          <div className="text-center py-4 text-3xl font-bold font-mono text-white">
            R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Metrics Table */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white text-black">
              <th className="py-2 px-2 text-center font-bold uppercase border-r border-zinc-300">Meta Mensal</th>
              <th className="py-2 px-2 text-center font-bold uppercase border-r border-zinc-300">Meta Semanal</th>
              <th className="py-2 px-2 text-center font-bold uppercase border-r border-zinc-300">Meta Diária</th>
              <th className="py-2 px-2 text-center font-bold uppercase border-r border-zinc-300">Realizado</th>
              <th className="py-2 px-2 text-center font-bold uppercase border-r border-zinc-300">Restam</th>
              <th className="py-2 px-2 text-center font-bold uppercase">% Atingido</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-black text-white border-b border-zinc-700">
              <td className="py-3 px-2 text-center font-mono border-r border-zinc-700">
                R$ {data.goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-2 text-center font-mono border-r border-zinc-700">
                R$ {weeklyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-2 text-center font-mono border-r border-zinc-700">
                R$ {dailyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-2 text-center font-mono border-r border-zinc-700">
                R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-2 text-center font-mono border-r border-zinc-700">
                R$ {remainingGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-2 text-center font-mono">
                {percentageAchieved.toFixed(0)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Section: Projection */}
      <div className="grid grid-cols-2 gap-0 border border-zinc-700 rounded-b-lg overflow-hidden">
        <div className="bg-black border-r border-zinc-700">
          <div className="bg-white text-black text-center font-bold py-1 uppercase text-xs tracking-wider">
            PROJEÇÃO
          </div>
          <div className="text-center py-2 font-mono text-white">
            R$ {projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-black">
          <div className="bg-white text-black text-center font-bold py-1 uppercase text-xs tracking-wider">
            DIFERENÇA
          </div>
          <div className={`text-center py-2 font-mono font-bold ${difference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {difference >= 0 
              ? `R$ ${difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Meta batida`
              : `R$ ${difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionDashboard;
