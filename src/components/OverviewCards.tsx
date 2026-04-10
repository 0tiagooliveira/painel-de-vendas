import React from 'react';
import { MonthlyData } from '../types';
import { getBusinessDaysInfo, getCurrentMonthId } from '../utils/dateUtils';
import { formatCurrency } from '../hooks/useDashboardData';
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react';

interface Props {
  data: MonthlyData;
}

export const OverviewCards: React.FC<Props> = ({ data }) => {
  const { total, elapsed } = getBusinessDaysInfo(data.id);
  const currentMonthId = getCurrentMonthId();

  const vendasTotais = data.vitralab + data.onixlab + data.nativalab;
  const progresso = data.meta > 0 ? (vendasTotais / data.meta) * 100 : 0;
  const mediaDiaria = elapsed > 0 ? vendasTotais / elapsed : 0;

  let projecao = 0;
  let projecaoText = '';

  if (data.id === currentMonthId) {
    projecao = mediaDiaria * total;
    projecaoText = formatCurrency(projecao);
  } else if (data.id < currentMonthId) {
    projecao = vendasTotais;
    projecaoText = formatCurrency(projecao);
  } else {
    projecaoText = '-';
  }

  return (
    <div>
      <div className="mb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
          Referente ao mes selecionado: {data.id}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Vendas Totais */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Vendas Totais</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(vendasTotais)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Progresso (Meta)</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {progresso.toFixed(1)}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${progresso >= 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
                style={{ width: `${Math.min(progresso, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Média Diária */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Média Diária</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(mediaDiaria)}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm text-gray-500">
              {elapsed} de {total} dias úteis
            </div>
          </div>
        </div>
      </div>

      {/* Projeção */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-purple-600" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Projeção Final</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {projecaoText}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
