import React, { useMemo } from 'react';
import { useCsvMemory } from '../hooks/useCsvMemory';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Package, ShoppingCart } from 'lucide-react';

interface Props {
  selectedMonthId: string;
}

const COMPANY_LABELS: Record<string, string> = {
  Vitralab: 'Vitralab',
  Onixlab: 'Onixlab',
  Nativalab: 'Nativalab',
};

const COMPANY_COLORS: Record<string, string> = {
  Vitralab: '#19d3a2',
  Onixlab: '#4d8dff',
  Nativalab: '#ff7a18',
};

export const OrderAnalytics: React.FC<Props> = ({ selectedMonthId }) => {
  const { state, loading } = useCsvMemory();

  const chartPalette = {
    panelBg: '#171a22',
    panelBorder: '#2a2f3a',
    grid: '#2b3140',
    axis: '#6b7280',
    axisText: '#8892a6',
    tooltipBg: '#1f2430',
    tooltipBorder: '#323949',
  };

  const { totalOrders, ordersByCompany, chartData, yearLabel } = useMemo(() => {
    const year = selectedMonthId.split('-')[0];
    const months = Array.from({ length: 12 }, (_, index) => {
      const monthNum = String(index + 1).padStart(2, '0');
      return `${year}-${monthNum}`;
    });

    const filtered = state.data.filter((item) => item.mesId.startsWith(`${year}-`));
    const companyMap = new Map<string, number>();
    const monthlyMap = new Map<string, { Vitralab: number; Onixlab: number; Nativalab: number }>();

    months.forEach((monthId) => {
      monthlyMap.set(monthId, { Vitralab: 0, Onixlab: 0, Nativalab: 0 });
    });

    filtered.forEach((item) => {
      companyMap.set(item.empresa, (companyMap.get(item.empresa) || 0) + 1);
      const monthTotals = monthlyMap.get(item.mesId);
      if (monthTotals) {
        monthTotals[item.empresa] += 1;
      }
    });

    const ordersByCompany = Object.entries(COMPANY_LABELS).map(([company]) => ({
      name: COMPANY_LABELS[company],
      value: companyMap.get(company) || 0,
      color: COMPANY_COLORS[company],
    }));

    const chartData = months.map((monthId) => {
      const monthData = monthlyMap.get(monthId) || { Vitralab: 0, Onixlab: 0, Nativalab: 0 };
      const date = new Date(parseInt(year, 10), parseInt(monthId.split('-')[1], 10) - 1);
      const monthName = date.toLocaleString('pt-BR', { month: 'short' });
      const formattedName = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;

      return {
        name: formattedName,
        Vitralab: monthData.Vitralab,
        Onixlab: monthData.Onixlab,
        Nativalab: monthData.Nativalab,
      };
    });

    return {
      totalOrders: filtered.length,
      ordersByCompany,
      chartData: ordersByCompany,
      chartData,
      yearLabel: year,
    };
  }, [selectedMonthId, state.data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div
          className="p-3 border shadow-lg rounded-md"
          style={{ backgroundColor: chartPalette.tooltipBg, borderColor: chartPalette.tooltipBorder }}
        >
          <p className="font-semibold text-gray-200 mb-2">{item.payload?.name || item.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name}: {entry.value} pedidos
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => `${value}`;

  if (loading) {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const hasOrders = chartData.some((month) => month.Vitralab > 0 || month.Onixlab > 0 || month.Nativalab > 0);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de pedidos no ano</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{totalOrders}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Empresas com pedidos no ano</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {ordersByCompany.filter((item) => item.value > 0).length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-xl shadow-lg"
        style={{ backgroundColor: chartPalette.panelBg, border: `1px solid ${chartPalette.panelBorder}` }}
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
          Pedidos por Empresa ao Longo do Ano ({yearLabel})
        </h3>
        <p className="text-sm text-gray-400 mb-6">Quantidade de pedidos por mês, separada por empresa.</p>

        {!hasOrders ? (
          <div className="h-[400px] flex items-center justify-center text-gray-400 text-sm">
            Nenhum pedido encontrado para o ano selecionado.
          </div>
        ) : (
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
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: chartPalette.axisText }}
                  axisLine={{ stroke: chartPalette.axis }}
                  tickLine={false}
                  tickMargin={10}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartPalette.axis, strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px', bottom: 0 }}
                  iconType="circle"
                  formatter={(value, entry: any) => <span style={{ color: entry.color, fontWeight: 600 }}>{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="Vitralab"
                  name="Vitralab"
                  stroke={COMPANY_COLORS.Vitralab}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COMPANY_COLORS.Vitralab, stroke: '#fff', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Onixlab"
                  name="Onixlab"
                  stroke={COMPANY_COLORS.Onixlab}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COMPANY_COLORS.Onixlab, stroke: '#fff', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Nativalab"
                  name="Nativalab"
                  stroke={COMPANY_COLORS.Nativalab}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COMPANY_COLORS.Nativalab, stroke: '#fff', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};