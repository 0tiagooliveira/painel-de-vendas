import React, { useState, useEffect } from 'react';
import { MonthlyData } from '../types';
import { saveMonthlyDataBatch } from '../services/db';
import { formatBRLInput, parseBRLInput } from '../utils/currencyUtils';
import { X, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  monthData: MonthlyData | null;
  isCreatingNew?: boolean;
}

export const DataEditorModal: React.FC<Props> = ({ isOpen, onClose, monthData, isCreatingNew = false }) => {
  const [monthId, setMonthId] = useState('');
  const [vitralab, setVitralab] = useState('');
  const [onixlab, setOnixlab] = useState('');
  const [nativalab, setNativalab] = useState('');
  const [meta, setMeta] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (monthData && isOpen) {
      setMonthId(monthData.id);
      setVitralab(formatBRLInput(monthData.vitralab));
      setOnixlab(formatBRLInput(monthData.onixlab));
      setNativalab(formatBRLInput(monthData.nativalab));
      setMeta(formatBRLInput(monthData.meta));
      setNotes(monthData.notes || '');
    }
  }, [monthData, isOpen]);

  if (!isOpen || !monthData) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingNew && !monthId.match(/^\d{4}-\d{2}$/)) {
      alert("O formato do mês deve ser YYYY-MM (ex: 2026-03)");
      return;
    }

    setIsSaving(true);
    try {
      // Create a clean object with only the fields that belong in the database
      const updatedData: MonthlyData = {
        id: monthId,
        vitralab: parseBRLInput(vitralab),
        onixlab: parseBRLInput(onixlab),
        nativalab: parseBRLInput(nativalab),
        meta: parseBRLInput(meta),
        notes,
        isCurrentMonth: monthData.isCurrentMonth
      };
      await saveMonthlyDataBatch([updatedData]);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar os dados. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrencyChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(formatBRLInput(e.target.value));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal panel */}
        <div className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {isCreatingNew ? 'Adicionar Novo Mês' : `Editar Dados - ${monthData.id}`}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                {isCreatingNew && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mês/Ano (YYYY-MM)</label>
                    <input 
                      type="text" 
                      value={monthId} 
                      onChange={(e) => setMonthId(e.target.value)} 
                      placeholder="Ex: 2026-03"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vitralab (R$)</label>
                  <input 
                    type="text" 
                    value={vitralab} 
                    onChange={handleCurrencyChange(setVitralab)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Onixlab (R$)</label>
                  <input 
                    type="text" 
                    value={onixlab} 
                    onChange={handleCurrencyChange(setOnixlab)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nativalab (R$)</label>
                  <input 
                    type="text" 
                    value={nativalab} 
                    onChange={handleCurrencyChange(setNativalab)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meta (R$)</label>
                  <input 
                    type="text" 
                    value={meta} 
                    onChange={handleCurrencyChange(setMeta)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    rows={3} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                  />
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-2" /> Salvar
                    </span>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={isSaving}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
