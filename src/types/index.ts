export interface MonthlyData {
  id: string; // Formato "YYYY-MM"
  vitralab: number;
  onixlab: number;
  nativalab: number;
  meta: number;
  notes: string;
  isCurrentMonth?: boolean;
}

export interface BusinessDaysInfo {
  total: number;
  elapsed: number;
}
