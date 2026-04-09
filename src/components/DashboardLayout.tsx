import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  error?: Error | null;
}

export const DashboardLayout: React.FC<Props> = ({ 
  children, 
  error 
}) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-[#0c0d10] shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-gray-700 shrink-0">
                <img
                  src="https://images.tcdn.com.br/files/1357340/themes/65/img/settings/Rodape.png?fab777a79b774a4a7cb8c5be223c6fae"
                  alt="Ionlab"
                  className="h-8 w-auto object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <img
                  src="https://ecommerce.sejaumpartner.com/wp-content/uploads/2022/12/PARCEIRO3.webp"
                  alt="Mercado Livre"
                  className="h-8 w-auto object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white truncate">
                  Painel de Controle
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Gestão de Vendas Mercado Livre
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-4">
              <div className="flex items-center space-x-2 min-w-0">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block truncate max-w-48">
                  {user?.displayName || user?.email || 'Usuário Convidado'}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Erro de Sincronização</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>Não foi possível carregar os dados do painel. Verifique sua conexão ou tente novamente.</p>
                    <p className="mt-1 text-xs opacity-75">{error.message}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-100 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 sm:px-0">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
