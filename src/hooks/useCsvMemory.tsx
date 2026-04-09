import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProcessedRow } from '../utils/csvProcessor';
import { listenToInvoices, deleteInvoicesByMonth } from '../services/db';

interface CsvMemoryState {
  data: ProcessedRow[];
}

interface AggregatedData {
  byRegion: { name: string; value: number }[];
  byCity: { name: string; value: number }[];
  topRegion: { name: string; value: number } | null;
  topCity: { name: string; value: number } | null;
}

interface CsvMemoryContextType {
  state: CsvMemoryState;
  clearPeriod: (mesId: string) => Promise<void>;
  getAggregatedData: (mesId: string) => AggregatedData;
  loading: boolean;
}

const CsvMemoryContext = createContext<CsvMemoryContextType | undefined>(undefined);

export const CsvMemoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CsvMemoryState>({ data: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToInvoices((data) => {
      setState({ data });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearPeriod = async (mesId: string) => {
    try {
      await deleteInvoicesByMonth(mesId);
      // The state will update automatically via the Firestore listener
    } catch (error) {
      console.error("Erro ao excluir importação:", error);
      alert("Erro ao excluir importação. Verifique o console.");
    }
  };

  const getAggregatedData = (mesId: string): AggregatedData => {
    const filtered = state.data.filter(d => d.mesId === mesId);

    if (filtered.length === 0) {
      return { byRegion: [], byCity: [], topRegion: null, topCity: null };
    }

    const regionMap = new Map<string, number>();
    const cityMap = new Map<string, number>();

    filtered.forEach(d => {
      regionMap.set(d.regiao, (regionMap.get(d.regiao) || 0) + d.vProd);
      cityMap.set(d.cidade, (cityMap.get(d.cidade) || 0) + d.vProd);
    });

    const byRegion = Array.from(regionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const byCity = Array.from(cityMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      byRegion,
      byCity,
      topRegion: byRegion.length > 0 ? byRegion[0] : null,
      topCity: byCity.length > 0 ? byCity[0] : null,
    };
  };

  return (
    <CsvMemoryContext.Provider value={{ 
      state, 
      clearPeriod, 
      getAggregatedData,
      loading
    }}>
      {children}
    </CsvMemoryContext.Provider>
  );
};

export const useCsvMemory = () => {
  const context = useContext(CsvMemoryContext);
  if (!context) {
    throw new Error('useCsvMemory must be used within a CsvMemoryProvider');
  }
  return context;
};
