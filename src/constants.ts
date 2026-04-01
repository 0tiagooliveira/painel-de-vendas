import { DashboardState } from './types';

// Função para sincronizar automaticamente o mês atual com a data do sistema
function getCurrentMonthId(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const monthMap: { [key: string]: string } = {
    '01': 'jan',
    '02': 'fev',
    '03': 'mar',
    '04': 'abr',
    '05': 'mai',
    '06': 'jun',
    '07': 'jul',
    '08': 'ago',
    '09': 'set',
    '10': 'out',
    '11': 'nov',
    '12': 'dez',
  };
  return `${monthMap[month]}-${year}`;
}

// Função para sincronizar o estado dos dados com o mês atual
export function syncDashboardDataWithCurrentMonth(data: DashboardState): DashboardState {
  const currentMonthId = getCurrentMonthId();
  
  // Atualiza o mês atual
  const syncedData = {
    ...data,
    currentMonthId,
    monthlyData: data.monthlyData.map(m => ({
      ...m,
      notes: m.id === currentMonthId && !m.notes?.startsWith('Mês') ? 'Mês atual.' : m.notes === 'Mês atual.' && m.id !== currentMonthId ? '' : m.notes,
    })),
  };
  
  return syncedData;
}

const rawData = {
  currentMonthId: 'mar-2026',
  monthlyData: [
    {
      id: 'dez-2025',
      month: 'Dezembro 2025',
      vitralabSales: 82726.38,
      onixlabSales: 33025.58,
      nativalabSales: 0,
      goal: 45682.41, // Calculado para dar a diferença de 70k (115751 - 70069)
      notes: 'Fim de ano forte.',
      invoiceCount: 0,
    },
    {
      id: 'jan-2026',
      month: 'Janeiro 2026',
      vitralabSales: 134991.08,
      onixlabSales: 50830.43,
      nativalabSales: 0,
      goal: 176500.00, // Calculado para dar a diferença de 9k (185821 - 9321)
      notes: 'Início de ano promissor.',
      invoiceCount: 0,
    },
    {
      id: 'fev-2026',
      month: 'Fevereiro 2026',
      vitralabSales: 138700.82,
      onixlabSales: 56442.44,
      nativalabSales: 0,
      goal: 352683.13, // Calculado para dar a diferença de -157k (195143 - (-157539))
      notes: 'Queda em relação à meta.',
      invoiceCount: 0,
    },
    {
      id: 'mar-2026',
      month: 'Março 2026',
      vitralabSales: 25288.72,
      onixlabSales: 12314.67,
      nativalabSales: 0,
      goal: 250000.00,
      notes: 'Mês atual.',
      invoiceCount: 36,
    },
    { id: 'abr-2026', month: 'Abril 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'mai-2026', month: 'Maio 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'jun-2026', month: 'Junho 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'jul-2026', month: 'Julho 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'ago-2026', month: 'Agosto 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'set-2026', month: 'Setembro 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'out-2026', month: 'Outubro 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
    { id: 'nov-2026', month: 'Novembro 2026', vitralabSales: 0, onixlabSales: 0, nativalabSales: 0, goal: 200000, notes: '', invoiceCount: 0 },
  ],
};

// Sincroniza os dados iniciais com o mês atual do sistema
export const INITIAL_DASHBOARD_DATA = syncDashboardDataWithCurrentMonth(rawData);
