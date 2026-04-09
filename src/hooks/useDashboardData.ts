import { useState, useEffect, useMemo } from 'react';
import { MonthlyData } from '../types';
import { listenToSalesData } from '../services/db';
import { getCurrentMonthId } from '../utils/dateUtils';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const useDashboardData = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string>(getCurrentMonthId());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToSalesData(
      (newData) => {
        setData(newData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const selectedMonthData = useMemo(() => {
    return data.find((d) => d.id === selectedMonthId) || null;
  }, [data, selectedMonthId]);

  return {
    data,
    selectedMonthId,
    setSelectedMonthId,
    selectedMonthData,
    loading,
    error,
  };
};
