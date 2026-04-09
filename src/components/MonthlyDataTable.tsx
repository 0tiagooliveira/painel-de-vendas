import React, { useState, useMemo } from 'react';
import { MonthlyData } from '../types';
import { formatCurrency } from '../hooks/useDashboardData';
import { getCurrentMonthId } from '../utils/dateUtils';
import { Edit2, Plus } from 'lucide-react';
import { DataEditorModal } from './DataEditorModal';

interface Props {
  data: MonthlyData[];
  selectedMonthId: string;
}

export const MonthlyDataTable: React.FC<Props> = ({ data, selectedMonthId }) => {
  const [editingMonth, setEditingMonth] = useState<MonthlyData | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const tableData = useMemo(() => {
    // Ordenação cronológica para calcular a variação
    const chrono = [...data].sort((a, b) => a.id.localeCompare(b.id));
    const currentMonthId = getCurrentMonthId();

    const withCalculations = chrono.map((m, index) => {
      const soma = m.vitralab + m.onixlab + m.nativalab;
      const diferenca = soma - m.meta;
      
      let variacao = 0;
      if (index > 0) {
        const prevSoma = chrono[index - 1].vitralab + chrono[index - 1].onixlab + chrono[index - 1].nativalab;
        if (prevSoma > 0) {
          variacao = ((soma - prevSoma) / prevSoma) * 100;
        }
      }

      const isFuture = m.id > currentMonthId;

      return {
        ...m,
        soma,
        diferenca,
        variacao,
        isFuture
      };
    });

    // Esconde meses históricos completamente vazios para evitar linhas órfãs após exclusões.
    const visibleRows = withCalculations.filter((row) => {
      if (row.isCurrentMonth) return true;
      const hasSales = row.vitralab > 0 || row.onixlab > 0 || row.nativalab > 0;
      const hasMeta = row.meta > 0;
      return hasSales || hasMeta;
    });

    // Ordenação final para a tabela: do mais recente para o mais antigo
    return visibleRows.sort((a, b) => b.id.localeCompare(a.id));
  }, [data, selectedMonthId]);

  const handleCreateNew = () => {
    // Default to the previous month of the current month if possible, or just empty
    const currentMonthId = getCurrentMonthId();
    const [year, month] = currentMonthId.split('-');
    let prevMonth = parseInt(month) - 1;
    let prevYear = parseInt(year);
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevMonthId = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;

    setEditingMonth({
      id: prevMonthId,
      vitralab: 0,
      onixlab: 0,
      nativalab: 0,
      meta: 0,
      notes: ''
    });
    setIsCreatingNew(true);
  };

  const handleCloseModal = () => {
    setEditingMonth(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Base de Valores</h2>
          <p className="mt-1 text-sm text-gray-500">
            Histórico completo de faturamento mensal e metas. Clique em Editar para alterar os valores manualmente.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Mês
        </button>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div>
          <table className="w-full table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mês/Ano</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vitralab</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Onixlab</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nativalab</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Soma</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Meta</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferença</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Variação %</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`transition-colors ${row.id === selectedMonthId ? 'bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                >
                  <td className="px-3 py-4 text-sm font-medium text-gray-900">
                    {row.id} 
                    {row.isCurrentMonth && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200">
                        Atual
                      </span>
                    )}
                    {row.id === selectedMonthId && !row.isCurrentMonth && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        Selecionado
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-right text-gray-500">{formatCurrency(row.vitralab)}</td>
                  <td className="px-3 py-4 text-sm text-right text-gray-500">{formatCurrency(row.onixlab)}</td>
                  <td className="px-3 py-4 text-sm text-right text-gray-500">{formatCurrency(row.nativalab)}</td>
                  <td className="px-3 py-4 text-sm text-right font-medium text-gray-900">{formatCurrency(row.soma)}</td>
                  <td className="px-3 py-4 text-sm text-right text-gray-500">{formatCurrency(row.meta)}</td>
                  
                  <td className={`px-3 py-4 text-sm text-right font-medium ${row.isFuture ? 'text-gray-400' : row.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.isFuture ? '-' : `${row.diferenca > 0 ? '+' : ''}${formatCurrency(row.diferenca)}`}
                  </td>
                  
                  <td className={`px-3 py-4 text-sm text-right font-medium ${row.isFuture ? 'text-gray-400' : row.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.isFuture ? '-' : `${row.variacao > 0 ? '+' : ''}${row.variacao.toFixed(1)}%`}
                  </td>
                  
                  <td className="px-3 py-4 text-sm text-gray-500 break-words" title={row.notes}>
                    {row.notes}
                  </td>
                  
                  <td className="px-3 py-4 text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        setEditingMonth(row);
                        setIsCreatingNew(false);
                      }} 
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center justify-end w-full py-2 px-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-4 text-center text-sm text-gray-500">
                    Nenhum dado disponível.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <DataEditorModal 
        isOpen={!!editingMonth} 
        onClose={handleCloseModal} 
        monthData={editingMonth} 
        isCreatingNew={isCreatingNew}
      />
    </div>
  );
};
