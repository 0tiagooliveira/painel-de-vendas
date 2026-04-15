import React, { useMemo } from 'react';
import { useCsvMemory } from '../hooks/useCsvMemory';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
  Vitralab: '#14b8a6',
  Onixlab: '#f97316',
  Nativalab: '#6366f1',
};

export const OrderAnalytics: React.FC<Props> = ({ selectedMonthId }) => {
  const { state, loading } = useCsvMemory();

  const { totalOrders, ordersByCompany, chartData } = useMemo(() => {
    const filtered = state.data.filter((item) => item.mesId === selectedMonthId);
    const companyMap = new Map<string, number>();

    filtered.forEach((item) => {
      companyMap.set(item.empresa, (companyMap.get(item.empresa) || 0) + 1);
    });

    const ordersByCompany = Object.entries(COMPANY_LABELS).map(([company]) => ({
      name: COMPANY_LABELS[company],
      value: companyMap.get(company) || 0,
      color: COMPANY_COLORS[company],
    }));

    return {
      totalOrders: filtered.length,
      ordersByCompany,
      chartData: ordersByCompany,
    };
  }, [selectedMonthId, state.data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 shadow-lg rounded-md">
          <p className="font-semibold text-gray-100 mb-1">Pedidos por empresa</p>
          <p className="text-blue-300 font-medium">
            {item.payload?.name || item.name}: {item.value} pedidos
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de pedidos</dt>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Empresas com pedidos</dt>
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

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Pedidos por empresa</h3>
            <p className="text-sm text-gray-500">Quantidade de pedidos importados no mês selecionado.</p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={56}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};