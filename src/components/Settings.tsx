import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, X } from 'lucide-react';
import { WorkSettings } from '../types/timebank';

interface SettingsProps {
  settings: WorkSettings;
  onUpdate: (settings: WorkSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setFormData(settings);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        title="Configurações"
      >
        <SettingsIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carga Horária Padrão (horas)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.defaultContractualHours}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                defaultContractualHours: parseFloat(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor padrão para novos registros
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo de Almoço (minutos)
            </label>
            <input
              type="number"
              min="0"
              max="480"
              value={formData.lunchBreakMinutes}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                lunchBreakMinutes: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Duração padrão do intervalo de almoço
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};