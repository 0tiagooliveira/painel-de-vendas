import React, { useMemo } from 'react';
import { MonthlyData } from '../types';
import { formatCurrency } from '../hooks/useDashboardData';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Props {
  data: MonthlyData[];
  selectedMonthId: string;
}

export const HistoricalCharts: React.FC<Props> = ({ data, selectedMonthId }) => {
  const chartPalette = {
    panelBg: '#171a22',
    panelBorder: '#2a2f3a',
    grid: '#2b3140',
    axis: '#6b7280',
    axisText: '#8892a6',
    tooltipBg: '#1f2430',
    tooltipBorder: '#323949',
    meta: '#ff7a18',
    total: '#19d3a2',
    onix: '#4d8dff',
  };

  const chartData = useMemo(() => {
    const year = selectedMonthId.split('-')[0];
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = (i + 1).toString().padStart(2, '0');
      return `${year}-${monthNum}`;
    });

    return months.map(monthId => {
      const m = data.find(d => d.id === monthId) || {
        id: monthId,
        vitralab: 0,
        onixlab: 0,
        nativalab: 0,
        meta: 0
      };

      const date = new Date(parseInt(year), parseInt(monthId.split('-')[1]) - 1);
      const monthName = date.toLocaleString('pt-BR', { month: 'long' });
      const formattedName = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

      return {
        name: formattedName,
        vendasTotais: m.vitralab + m.onixlab + m.nativalab,
        meta: m.meta,
        vitralab: m.vitralab,
        onixlab: m.onixlab,
        nativalab: m.nativalab,
      };
    });
  }, [data, selectedMonthId]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 border shadow-lg rounded-md"
          style={{ backgroundColor: chartPalette.tooltipBg, borderColor: chartPalette.tooltipBorder }}
        >
          <p className="font-semibold text-gray-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-6 mt-8">
      {/* Gráfico 1: Evolução Mensal (Linha) */}
      <div
        className="p-6 rounded-xl shadow-lg"
        style={{ backgroundColor: chartPalette.panelBg, border: `1px solid ${chartPalette.panelBorder}` }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-wider">
          Evolução de Vendas (Vitralab + Onixlab + Nativalab)
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke={chartPalette.grid} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: chartPalette.axisText }} 
                tickMargin={15} 
                axisLine={{ stroke: chartPalette.axis }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: chartPalette.axisText }} 
                axisLine={{ stroke: chartPalette.axis }}
                tickLine={false}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartPalette.axis, strokeWidth: 1, strokeDasharray: '3 3' }} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', bottom: 0 }} 
                iconType="circle"
                formatter={(value, entry: any) => <span style={{ color: entry.color, fontWeight: 600 }}>{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                name="Meta" 
                stroke={chartPalette.meta} 
                strokeWidth={1.5} 
                strokeDasharray="5 5" 
                dot={{ r: 3, fill: '#fff', stroke: chartPalette.meta, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="vendasTotais" 
                name="Vendas Totais (Soma)" 
                stroke={chartPalette.total} 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: chartPalette.total, stroke: '#fff', strokeWidth: 1 }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Composição de Vendas (Barras Empilhadas) */}
      <div
        className="p-6 rounded-xl shadow-lg"
        style={{ backgroundColor: chartPalette.panelBg, border: `1px solid ${chartPalette.panelBorder}` }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-6 uppercase tracking-wider">
          Composição Mensal
        </h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 25, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke={chartPalette.grid} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: chartPalette.axisText }} 
                tickMargin={15} 
                axisLine={{ stroke: chartPalette.axis }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: chartPalette.axisText }} 
                axisLine={{ stroke: chartPalette.axis }}
                tickLine={false}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: chartPalette.tooltipBg }} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', bottom: 0 }} 
                iconType="square"
                formatter={(value, entry: any) => <span style={{ color: entry.color, fontWeight: 600 }}>{value}</span>}
              />
              <Bar dataKey="nativalab" name="Nativalab" stackId="a" fill={chartPalette.meta} />
              <Bar dataKey="onixlab" name="Onixlab" stackId="a" fill={chartPalette.onix} />
              <Bar dataKey="vitralab" name="Vitralab" stackId="a" fill={chartPalette.total} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
