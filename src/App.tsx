import React, { useState, useEffect } from 'react';
import { DashboardOverview } from './components/DashboardOverview';
import { PerformanceCharts } from './components/PerformanceCharts';
import { DataEditor } from './components/DataEditor';
import { BaseDeValoresTable } from './components/BaseDeValoresTable';
import CommissionDashboard from './components/CommissionDashboard';
import { INITIAL_DASHBOARD_DATA } from './constants';
import { DashboardState, MonthlyData } from './types';
import { Settings, LogOut, Loader2 } from 'lucide-react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, onSnapshot, setDoc, getDoc, writeBatch } from 'firebase/firestore';

function DashboardApp() {
  const { user, logOut } = useAuth();
  const [data, setData] = useState<DashboardState>(INITIAL_DASHBOARD_DATA);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Fetch data from Firestore
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const userId = user.uid;

    // Listen to user profile (for currentMonthId)
    const unsubscribeUser = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.currentMonthId) {
          setData(prev => ({ ...prev, currentMonthId: userData.currentMonthId }));
        }
      } else {
        // Initialize user profile if it doesn't exist
        setDoc(doc(db, 'users', userId), { currentMonthId: INITIAL_DASHBOARD_DATA.currentMonthId })
          .catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${userId}`));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    });

    // Listen to monthly data
    const unsubscribeMonthly = onSnapshot(collection(db, `users/${userId}/monthlyData`), (snapshot) => {
      if (!snapshot.empty) {
        const monthlyData: MonthlyData[] = [];
        snapshot.forEach((doc) => {
          monthlyData.push(doc.data() as MonthlyData);
        });
        
        // Sort by id or month to keep order consistent (assuming id format allows sorting, or just use the predefined order)
        // For simplicity, we'll sort by the index in INITIAL_DASHBOARD_DATA
        const orderMap = new Map(INITIAL_DASHBOARD_DATA.monthlyData.map((m, i) => [m.id, i]));
        monthlyData.sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));

        setData(prev => ({ ...prev, monthlyData }));
      } else {
        // Initialize monthly data if empty
        const batch = writeBatch(db);
        INITIAL_DASHBOARD_DATA.monthlyData.forEach(month => {
          const docRef = doc(db, `users/${userId}/monthlyData`, month.id);
          batch.set(docRef, month);
        });
        batch.commit().catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${userId}/monthlyData`));
      }
      setIsSyncing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/monthlyData`);
    });

    return () => {
      unsubscribeUser();
      unsubscribeMonthly();
    };
  }, [user]);

  const handleUpdateData = async (newData: DashboardState) => {
    if (!user) return;
    const userId = user.uid;
    
    try {
      const batch = writeBatch(db);
      
      // Update currentMonthId
      if (newData.currentMonthId !== data.currentMonthId) {
        batch.update(doc(db, 'users', userId), { currentMonthId: newData.currentMonthId });
      }

      // Update monthly data
      newData.monthlyData.forEach(month => {
        const docRef = doc(db, `users/${userId}/monthlyData`, month.id);
        batch.set(docRef, month, { merge: true });
      });

      await batch.commit();
      
      // Local state will be updated by onSnapshot listeners
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (!user) {
    return null; // Handled by AuthWrapper
  }

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Get current month data for overview
  const currentMonthData = data.monthlyData.find(m => m.id === data.currentMonthId) || data.monthlyData[0];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logos */}
            <div className="flex items-center gap-4 border-r border-zinc-700 pr-6">
              <img 
                src="https://images.tcdn.com.br/files/1357340/themes/65/img/settings/Rodape.png?fab777a79b774a4a7cb8c5be223c6fae" 
                alt="IonLab Logo" 
                className="h-8 object-contain"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://ecommerce.sejaumpartner.com/wp-content/uploads/2022/12/PARCEIRO3.webp" 
                alt="Mercado Livre Logo" 
                className="h-8 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="hidden md:block">
              <h1 className="text-xl font-bold tracking-tight text-white">Painel de Controle</h1>
              <p className="text-xs text-zinc-500 font-medium">Gestão de Vendas Mercado Livre</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <select 
                value={data.currentMonthId}
                onChange={(e) => handleUpdateData({ ...data, currentMonthId: e.target.value })}
                className="bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer text-right appearance-none"
              >
                {data.monthlyData.map(m => (
                  <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                    {m.month}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">Sincronizado na nuvem</p>
            </div>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-all border border-zinc-700 hover:border-zinc-600"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurar Dados</span>
            </button>
            <button
              onClick={logOut}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {currentMonthData && (
          <>
            <DashboardOverview data={currentMonthData} />
            <CommissionDashboard data={currentMonthData} />
          </>
        )}
        
        <PerformanceCharts data={data.monthlyData} />
        <BaseDeValoresTable data={data.monthlyData} />
      </main>

      {/* Editor Modal */}
      <DataEditor 
        data={data} 
        onUpdate={handleUpdateData} 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
      />
    </div>
  );
}

function AuthWrapper() {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center gap-4 mb-8">
            <img 
              src="https://images.tcdn.com.br/files/1357340/themes/65/img/settings/Rodape.png?fab777a79b774a4a7cb8c5be223c6fae" 
              alt="IonLab Logo" 
              className="h-10 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Painel de Controle</h1>
          <p className="text-zinc-400 mb-8">Faça login para acessar e sincronizar seus dados de vendas.</p>
          
          <button
            onClick={signIn}
            className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return <DashboardApp />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <AuthWrapper />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
