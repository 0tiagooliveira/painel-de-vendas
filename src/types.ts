export interface MonthlyData {
  id: string;
  month: string;
  vitralabSales: number;
  onixlabSales: number;
  nativalabSales: number;
  goal: number; // Meta para cálculo de diferença e %
  notes: string;
}

export interface DashboardState {
  currentMonthId: string; // ID do mês selecionado para o overview
  monthlyData: MonthlyData[];
}
