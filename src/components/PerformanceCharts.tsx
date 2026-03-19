import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { MonthlyData } from '../types';

interface PerformanceChartsProps {
  data: MonthlyData[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ data }) => {
  // Filter out empty months for cleaner charts
  const activeData = data.filter(d => d.vitralabSales > 0 || d.onixlabSales > 0 || d.nativalabSales > 0 || d.goal > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Sales Evolution */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm col-span-1 lg:col-span-2">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-6">Evolução de Vendas (Vitralab vs Onixlab vs Nativalab)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={activeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend />
              <Line type="monotone" dataKey="vitralabSales" name="Vitralab" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="onixlabSales" name="Onixlab" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="nativalabSales" name="Nativalab" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="goal" name="Meta" stroke="#ff7300" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Composition */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-sm col-span-1 lg:col-span-2">
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-6">Composição Mensal</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend />
              <Bar dataKey="vitralabSales" name="Vitralab" stackId="a" fill="#10b981" />
              <Bar dataKey="onixlabSales" name="Onixlab" stackId="a" fill="#3b82f6" />
              <Bar dataKey="nativalabSales" name="Nativalab" stackId="a" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
