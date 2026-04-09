import React from 'react';
import { MonthlyData } from '../types';
import { getBusinessDaysInfo } from '../utils/dateUtils';
import { formatCurrency } from '../hooks/useDashboardData';
import { Calculator, Target, TrendingUp, AlertCircle, CheckCircle2, Briefcase } from 'lucide-react';

interface Props {
  data: MonthlyData;
}

export const CommissionCards: React.FC<Props> = ({ data }) => {
  const { total, elapsed } = getBusinessDaysInfo(data.id);

  // Cálculos de Comissão
  const vendasTotais = data.vitralab + data.onixlab + data.nativalab;
  const baseLiquida = vendasTotais * 0.8004; // Deduzindo 19,96%
  const comissao = baseLiquida * 0.005; // 0,5% sobre a base líquida

  // Cálculos de Metas
  const metaDiaria = total > 0 ? data.meta / total : 0;
  const metaSemanal = data.meta / 4.33;
  const restanteMeta = Math.max(0, data.meta - vendasTotais);

  // Projeção Operacional
  const projecaoOperacional = elapsed * metaDiaria;
  const diferenca = vendasTotais - projecaoOperacional;
  const isMetaBatida = diferenca > 0;

  return (
    <div className="space-y-6">
      {/* Comissão Líquida */}
      <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
            <Briefcase className="h-5 w-5 text-gray-400 mr-2" />
            Comissão Líquida
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Vendas Totais</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(vendasTotais)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Base Líquida (-19,96%)</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(baseLiquida)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Comissão (0,5%)</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-300">{formatCurrency(comissao)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel de Metas */}
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
              <Target className="h-5 w-5 text-gray-400 mr-2" />
              Painel de Metas
            </h3>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Meta Diária</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(metaDiaria)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Meta Semanal</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(metaSemanal)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Restante para Meta Mensal</dt>
                <dd className="mt-1 flex items-baseline">
                  <span className={`text-2xl font-bold ${restanteMeta === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(restanteMeta)}
                  </span>
                  {restanteMeta === 0 && (
                    <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Projeção Operacional */}
        <div className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${isMetaBatida ? 'border-l-green-500' : 'border-l-blue-500'}`}>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
                Projeção Operacional
              </h3>
              {isMetaBatida && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Meta batida
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Projeção (Esperado até hoje)</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{formatCurrency(projecaoOperacional)}</p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500">Diferença (Realizado vs Esperado)</p>
                <div className="mt-1 flex items-center">
                  <span className={`text-2xl font-bold ${isMetaBatida ? 'text-green-600' : 'text-red-600'}`}>
                    {diferenca > 0 ? '+' : ''}{formatCurrency(diferenca)}
                  </span>
                  {!isMetaBatida && diferenca < 0 && (
                    <AlertCircle className="ml-2 h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
