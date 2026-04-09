import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { OverviewCards } from '../components/OverviewCards';
import { CommissionCards } from '../components/CommissionCards';
import { HistoricalCharts } from '../components/HistoricalCharts';
import { MonthlyDataTable } from '../components/MonthlyDataTable';
import { CsvUploader } from '../components/CsvUploader';
import { CsvDashboard } from '../components/CsvDashboard';
import { useDashboardData } from '../hooks/useDashboardData';
import { CsvMemoryProvider } from '../hooks/useCsvMemory';
import { Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data, selectedMonthId, setSelectedMonthId, selectedMonthData, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <CsvMemoryProvider>
      <DashboardLayout error={error}>
        <div className="mb-6 bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Período de Análise</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Selecione o mês para visualizar os indicadores</p>
            </div>
          </div>
          <select
            value={selectedMonthId}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            className="block w-full sm:w-64 pl-3 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-medium shadow-sm cursor-pointer transition-colors duration-200"
          >
            {data.length === 0 && (
              <option value={selectedMonthId}>{selectedMonthId}</option>
            )}
            {data.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} {m.isCurrentMonth ? '(Atual)' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedMonthData ? (
          <div className="space-y-8 pb-12">
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Visão Geral</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Resumo rápido dos principais indicadores do mês selecionado.</p>
              <OverviewCards data={selectedMonthData} />
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Comercial & Operacional</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Acompanhamento de comissão, metas e desempenho operacional.</p>
              <CommissionCards data={selectedMonthData} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Tendência Histórica</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Evolução mensal e composição das vendas ao longo do ano.</p>
              <HistoricalCharts data={data} selectedMonthId={selectedMonthId} />
            </section>

            <section className="pt-8 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Análise Regional</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Leitura detalhada por região e cidade para o mês selecionado no topo.
              </p>
              <CsvDashboard selectedMonthId={selectedMonthId} />
            </section>

            <section className="pt-8 border-t border-gray-200 dark:border-gray-700 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Gestão de Dados</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Importe planilhas CSV e mantenha a base mensal organizada para análise e edição.
                </p>
                <CsvUploader />
              </div>

              <div>
                <MonthlyDataTable data={data} selectedMonthId={selectedMonthId} />
              </div>
            </section>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center transition-colors duration-200">
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum dado encontrado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Não há registros de vendas para o mês selecionado ({selectedMonthId}).
            </p>
          </div>
        )}
      </DashboardLayout>
    </CsvMemoryProvider>
  );
};
