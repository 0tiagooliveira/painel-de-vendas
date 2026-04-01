import React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { MonthlyData } from '../types';
import { TrendingUp } from 'lucide-react';

interface SalesEvolutionComparisonProps {
  data: MonthlyData[];
  currentMonthId: string;
}

export const SalesEvolutionComparison: React.FC<SalesEvolutionComparisonProps> = ({ data, currentMonthId }) => {
  // Filter out empty months for cleaner charts
  const activeData = data.filter(d => d.vitralabSales > 0 || d.onixlabSales > 0 || d.nativalabSales > 0 || d.goal > 0);

  // Calculate cumulative data for stacked visualization
  const cumulativeData = activeData.map(month => ({
    ...month,
    totalSales: month.vitralabSales + month.onixlabSales + month.nativalabSales,
    vitralab: month.vitralabSales,
    onixlab: month.onixlabSales,
    nativalab: month.nativalabSales,
    goalAchieved: Math.round(((month.vitralabSales + month.onixlabSales + month.nativalabSales) / month.goal) * 100),
  }));

  // Calculate current month metrics
  const currentMonth = data.find(m => m.id === currentMonthId);
  if (!currentMonth) return null;

  const currentTotal = currentMonth.vitralabSales + currentMonth.onixlabSales + currentMonth.nativalabSales;
  const currentPercentage = currentMonth.goal > 0 ? Math.round((currentTotal / currentMonth.goal) * 100) : 0;

  // Breakdown by company
  const companies = [
    {
      name: 'Vitralab',
      color: '#10b981',
      value: currentMonth.vitralabSales,
      percentage: currentMonth.goal > 0 ? (currentMonth.vitralabSales / currentMonth.goal) * 100 : 0,
    },
    {
      name: 'Onixlab',
      color: '#3b82f6',
      value: currentMonth.onixlabSales,
      percentage: currentMonth.goal > 0 ? (currentMonth.onixlabSales / currentMonth.goal) * 100 : 0,
    },
    {
      name: 'Nativalab',
      color: '#f97316',
      value: currentMonth.nativalabSales,
      percentage: currentMonth.goal > 0 ? (currentMonth.nativalabSales / currentMonth.goal) * 100 : 0,
    },
  ];

  // Sort by value descending
  const sortedCompanies = [...companies].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-emerald-500 w-6 h-6" />
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Evolução de Vendas - Soma das 3 Empresas</h2>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {currentPercentage}%
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {currentMonth.goal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              currentPercentage >= 100 ? 'bg-emerald-500' : 
              currentPercentage >= 80 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`} 
            style={{ width: `${Math.min(currentPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Stacked Area Chart - Evolution over months */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-6">Progressão Mensal (Soma das 3 Empresas)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cumulativeData}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorVitralab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorOnixlab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorNativalab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend />
              <Area type="monotone" dataKey="vitralab" stackId="1" name="Vitralab" stroke="#10b981" fillOpacity={1} fill="url(#colorVitralab)" />
              <Area type="monotone" dataKey="onixlab" stackId="1" name="Onixlab" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOnixlab)" />
              <Area type="monotone" dataKey="nativalab" stackId="1" name="Nativalab" stroke="#f97316" fillOpacity={1} fill="url(#colorNativalab)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current Month Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contribution Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-6">Contribuição de Cada Empresa ({currentMonth.month})</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedCompanies}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="name" type="category" stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]}>
                  {sortedCompanies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Percentage Contribution */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm">
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-6">% da Meta por Empresa</h3>
          <div className="space-y-6">
            {sortedCompanies.map((company, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: company.color }}
                    ></div>
                    <span className="text-white font-medium">{company.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {company.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-zinc-500">
                      R$ {company.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all" 
                    style={{ 
                      width: `${Math.min(company.percentage, 100)}%`,
                      backgroundColor: company.color
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Comparison Table */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm overflow-x-auto">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-6">Histórico de Atingimento de Meta</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left py-3 px-4 text-zinc-400 font-medium">Mês</th>
              <th className="text-right py-3 px-4 text-zinc-400 font-medium">Vitralab</th>
              <th className="text-right py-3 px-4 text-zinc-400 font-medium">Onixlab</th>
              <th className="text-right py-3 px-4 text-zinc-400 font-medium">Nativalab</th>
              <th className="text-right py-3 px-4 text-zinc-400 font-medium">Total</th>
              <th className="text-right py-3 px-4 text-zinc-400 font-medium">Meta</th>
              <th className="text-center py-3 px-4 text-zinc-400 font-medium">Atingimento</th>
            </tr>
          </thead>
          <tbody>
            {cumulativeData.map((month, idx) => (
              <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="py-3 px-4 text-white">{month.month}</td>
                <td className="text-right py-3 px-4 text-emerald-400">R$ {month.vitralabSales.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-blue-400">R$ {month.onixlabSales.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-orange-400">R$ {month.nativalabSales.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-white font-bold">R$ {month.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                <td className="text-right py-3 px-4 text-zinc-400">R$ {month.goal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                <td className="text-center py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    month.goalAchieved >= 100 ? 'bg-emerald-900 text-emerald-300' :
                    month.goalAchieved >= 80 ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {month.goalAchieved}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
