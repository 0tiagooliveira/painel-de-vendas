import React, { useState } from 'react';
import { DashboardState, MonthlyData } from '../types';
import { Save, X } from 'lucide-react';

interface DataEditorProps {
  data: DashboardState;
  onUpdate: (newData: DashboardState) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Format number to Brazilian currency display format (e.g., 191297.55 -> 191.297,55)
const formatBRL = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Parse Brazilian currency format to number (e.g., "191.297,55" -> 191297.55)
const parseBRL = (value: string): number => {
  if (!value) return 0;
  // Remove the thousands separator (.) and replace decimal separator (,) with (.)
  const normalized = value.replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(normalized) || 0;
};

export const DataEditor: React.FC<DataEditorProps> = ({ data, onUpdate, isOpen, onClose }) => {
  const [localData, setLocalData] = useState<DashboardState>(data);
  const [editingFields, setEditingFields] = useState<{ [key: string]: boolean }>({});

  // Update local state when props change
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleMonthlyDataChange = (index: number, field: keyof MonthlyData, value: string | number) => {
    const newMonthlyData = [...localData.monthlyData];
    
    // Parse the value based on field type
    let parsedValue: string | number;
    if (typeof value === 'string' && ['vitralabSales', 'onixlabSales', 'nativalabSales', 'goal'].includes(field as string)) {
      parsedValue = parseBRL(value);
    } else {
      parsedValue = value;
    }
    
    newMonthlyData[index] = {
      ...newMonthlyData[index],
      [field]: parsedValue
    };
    setLocalData(prev => ({ ...prev, monthlyData: newMonthlyData }));
  };

  const handleSave = () => {
    onUpdate(localData);
    onClose();
  };

  const toggleFieldEditing = (fieldId: string) => {
    setEditingFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const getFieldId = (monthId: string, fieldName: string): string => `${monthId}-${fieldName}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-4xl bg-zinc-900 h-full overflow-y-auto border-l border-zinc-800 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-zinc-900 py-4 border-b border-zinc-800 z-10">
          <h2 className="text-xl font-bold text-white">Editar Base de Valores</h2>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <div className="space-y-4">
              {localData.monthlyData.map((monthData, index) => (
                <div key={monthData.id} className="bg-zinc-800/50 border border-zinc-800 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-3 border-b border-zinc-700 pb-2">{monthData.month}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Venda Vitralab (R$)</label>
                      <input
                        type="text"
                        value={editingFields[getFieldId(monthData.id, 'vitralabSales')] ? monthData.vitralabSales : formatBRL(monthData.vitralabSales)}
                        onChange={(e) => handleMonthlyDataChange(index, 'vitralabSales', e.target.value)}
                        onFocus={() => toggleFieldEditing(getFieldId(monthData.id, 'vitralabSales'))}
                        onBlur={() => toggleFieldEditing(getFieldId(monthData.id, 'vitralabSales'))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Venda Onixlab (R$)</label>
                      <input
                        type="text"
                        value={editingFields[getFieldId(monthData.id, 'onixlabSales')] ? monthData.onixlabSales : formatBRL(monthData.onixlabSales)}
                        onChange={(e) => handleMonthlyDataChange(index, 'onixlabSales', e.target.value)}
                        onFocus={() => toggleFieldEditing(getFieldId(monthData.id, 'onixlabSales'))}
                        onBlur={() => toggleFieldEditing(getFieldId(monthData.id, 'onixlabSales'))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Venda Nativalab (R$)</label>
                      <input
                        type="text"
                        value={editingFields[getFieldId(monthData.id, 'nativalabSales')] ? monthData.nativalabSales : formatBRL(monthData.nativalabSales)}
                        onChange={(e) => handleMonthlyDataChange(index, 'nativalabSales', e.target.value)}
                        onFocus={() => toggleFieldEditing(getFieldId(monthData.id, 'nativalabSales'))}
                        onBlur={() => toggleFieldEditing(getFieldId(monthData.id, 'nativalabSales'))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Meta (R$)</label>
                      <input
                        type="text"
                        value={editingFields[getFieldId(monthData.id, 'goal')] ? monthData.goal : formatBRL(monthData.goal)}
                        onChange={(e) => handleMonthlyDataChange(index, 'goal', e.target.value)}
                        onFocus={() => toggleFieldEditing(getFieldId(monthData.id, 'goal'))}
                        onBlur={() => toggleFieldEditing(getFieldId(monthData.id, 'goal'))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <label className="block text-xs text-zinc-500 mb-1">Notas</label>
                      <input
                        type="text"
                        value={monthData.notes}
                        onChange={(e) => handleMonthlyDataChange(index, 'notes', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
