import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Readonly<Props>;

  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'Ocorreu um erro inesperado.';
      let isFirestoreError = false;
      
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.operationType) {
          isFirestoreError = true;
          errorMessage = parsedError.error;
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-red-500 mb-4">Ops! Algo deu errado.</h2>
            <p className="text-zinc-300 mb-4">
              {isFirestoreError 
                ? "Erro de permissão ou conexão com o banco de dados. Verifique se você está logado." 
                : "Ocorreu um erro ao carregar o aplicativo."}
            </p>
            <div className="bg-black p-3 rounded text-xs font-mono text-red-400 overflow-auto max-h-40 mb-6">
              {errorMessage}
            </div>
            <button
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg transition-colors"
              onClick={() => window.location.reload()}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
