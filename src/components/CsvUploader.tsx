import React, { useState, useRef } from 'react';
import { processCsv, EmpresaType } from '../utils/csvProcessor';
import { updateCompanyMonthTotal, saveInvoiceBatch } from '../services/db';
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export const CsvUploader: React.FC = () => {
  const [empresa, setEmpresa] = useState<EmpresaType | ''>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string, details?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, errors, monthId } = await processCsv(file, empresa as EmpresaType);
      
      // Save detailed invoices to Firestore
      await saveInvoiceBatch(data);
      
      // Calculate total and save to Firestore
      const totalVProd = data.reduce((acc, row) => acc + row.vProd, 0);
      await updateCompanyMonthTotal(monthId, empresa as string, totalVProd);
      
      if (errors && errors.length > 0) {
        setMessage({
          type: 'warning',
          text: `Upload concluído com avisos! ${data.length} itens inseridos. O total de R$ ${(totalVProd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi salvo na Base de Valores.`,
          details: errors
        });
      } else {
        setMessage({
          type: 'success',
          text: `Upload concluído com sucesso! ${data.length} itens inseridos. O total de R$ ${(totalVProd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi salvo na Base de Valores.`
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Erro inesperado ao processar o arquivo CSV.'
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg border border-gray-200 mt-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center mb-4">
          <FileSpreadsheet className="h-5 w-5 text-gray-400 mr-2" />
          Importar Faturamento (CSV)
        </h3>
        
        <div className="max-w-xl text-sm text-gray-500 mb-5">
          <p>
            Faça o upload do relatório de vendas exportado do sistema. Os dados processados aqui 
            serão salvos no banco de dados para análise detalhada e podem ser excluídos posteriormente.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-64">
            <label htmlFor="empresa-select" className="sr-only">Selecione a Empresa</label>
            <select
              id="empresa-select"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value as EmpresaType)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>Selecione a Empresa...</option>
              <option value="Vitralab">Vitralab</option>
              <option value="Onixlab">Onixlab</option>
              <option value="Nativalab">Nativalab</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={!empresa || loading}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                !empresa || loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Processando...' : 'Selecionar Arquivo CSV'}
            </label>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50' : 
            message.type === 'warning' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : message.type === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3 w-full">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-800' : 
                  message.type === 'warning' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {message.text}
                </p>
                {message.details && message.details.length > 0 && (
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {message.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
