import React, { useState } from 'react';
import { useCsvMemory } from '../hooks/useCsvMemory';
import { formatCurrency } from '../hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Map, Trash2, BarChart3 } from 'lucide-react';

interface Props {
  selectedMonthId: string;
}

export const CsvDashboard: React.FC<Props> = ({ selectedMonthId }) => {
  const { getAggregatedData, clearPeriod, loading } = useCsvMemory();
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) {
    return (
      <div className="mt-8 flex justify-center items-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mesId = selectedMonthId;
  const { byRegion, byCity, topRegion, topCity } = getAggregatedData(mesId);

  if (byRegion.length === 0) {
    return (
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sem dados analíticos para {mesId}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Importe um CSV em Gestão de Dados para habilitar a análise por região e cidade deste mês.
        </p>
      </div>
    );
  }

  const formatYAxis = (val: number) => `R$ ${(val / 1000).toFixed(0)}k`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 shadow-lg rounded-md">
          <p className="font-semibold text-gray-100 mb-1">{label}</p>
          <p className="text-blue-400 font-medium">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir os dados importados do mês ${mesId}? Isso remove os dados de todas as empresas deste mês e pode remover o mês da Base de Valores se ele ficar vazio.`)) {
      setIsDeleting(true);
      await clearPeriod(mesId);
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            Análise de Faturamento
          </h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/40 dark:text-blue-200">
            {mesId}
          </span>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir Importações do Mês
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* KPI Região Líder */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Map className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Região Líder</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {topRegion?.name || '-'}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      {topRegion ? formatCurrency(topRegion.value) : ''}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cidade Líder */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MapPin className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cidade Líder</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {topCity?.name || '-'}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      {topCity ? formatCurrency(topCity.value) : ''}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Regiões */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Faturamento por Região</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={byRegion} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" />
                <XAxis type="number" tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#D1D5DB', fontWeight: 500 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#374151' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Cidades */}
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Faturamento por Cidade</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-0" style={{ maxHeight: '320px' }}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Faturamento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {byCity.map((city, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {city.name}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-right text-gray-500">
                      {formatCurrency(city.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
