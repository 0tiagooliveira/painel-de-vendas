import { BusinessDaysInfo } from '../types';

export const getCurrentMonthId = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const isBusinessDay = (date: Date): boolean => {
  const day = date.getDay();
  // 0 = Domingo, 6 = Sábado
  return day !== 0 && day !== 6;
};

export const getBusinessDaysInfo = (monthId: string): BusinessDaysInfo => {
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;

  const currentMonthId = getCurrentMonthId();
  const now = new Date();

  // Total de dias no mês fornecido
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  
  let total = 0;
  for (let i = 1; i <= daysInMonth; i++) {
    if (isBusinessDay(new Date(year, monthIndex, i))) {
      total++;
    }
  }

  let elapsed = 0;

  if (monthId === currentMonthId) {
    // Mês atual: conta apenas do dia 1 até o dia de hoje
    const todayDate = now.getDate();
    for (let i = 1; i <= todayDate; i++) {
      if (isBusinessDay(new Date(year, monthIndex, i))) {
        elapsed++;
      }
    }
  } else if (monthId < currentMonthId) {
    // Mês passado: elapsed é igual ao total de dias úteis do mês fechado
    elapsed = total;
  } else {
    // Mês futuro: elapsed é sempre 0
    elapsed = 0;
  }

  return { total, elapsed };
};
