import React, { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { TimeEntry, WorkSettings } from '../types/timebank';

interface TimeEntryFormProps {
  onSubmit: (entry: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>) => void;
  settings: WorkSettings;
  editingEntry?: TimeEntry;
  onCancel?: () => void;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({ 
  onSubmit, 
  settings, 
  editingEntry,
  onCancel 
}) => {
  const [isOpen, setIsOpen] = useState(!!editingEntry);
  const [formData, setFormData] = useState({
    date: editingEntry?.date || new Date().toISOString().split('T')[0],
    checkIn: editingEntry?.checkIn || '09:00',
    lunchOut: editingEntry?.lunchOut || '',
    lunchIn: editingEntry?.lunchIn || '',
    checkOut: editingEntry?.checkOut || '18:00',
    contractualHours: editingEntry?.contractualHours || settings.defaultContractualHours,
    notes: editingEntry?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.checkIn || !formData.checkOut) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const entry = {
      ...formData,
      lunchOut: formData.lunchOut || undefined,
      lunchIn: formData.lunchIn || undefined,
      notes: formData.notes || undefined,
    };

    onSubmit(entry);
    
    if (!editingEntry) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:00',
        lunchOut: '',
        lunchIn: '',
        checkOut: '18:00',
        contractualHours: settings.defaultContractualHours,
        notes: '',
      });
      setIsOpen(false);
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      setIsOpen(false);
    }
  };

  if (!isOpen && !editingEntry) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        <Plus className="w-4 h-4" />
        Adicionar Registro
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingEntry ? 'Editar Registro' : 'Novo Registro'}
        </h3>
        {!editingEntry && (
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entrada *
            </label>
            <input
              type="time"
              value={formData.checkIn}
              onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saída *
            </label>
            <input
              type="time"
              value={formData.checkOut}
              onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Saída Almoço
            </label>
            <input
              type="time"
              value={formData.lunchOut}
              onChange={(e) => setFormData(prev => ({ ...prev, lunchOut: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volta Almoço
            </label>
            <input
              type="time"
              value={formData.lunchIn}
              onChange={(e) => setFormData(prev => ({ ...prev, lunchIn: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horas Contratuais
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.contractualHours}
              onChange={(e) => setFormData(prev => ({ ...prev, contractualHours: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors duration-200"
            placeholder="Adicione observações sobre este registro..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
          >
            <Save className="w-4 h-4" />
            {editingEntry ? 'Salvar Alterações' : 'Adicionar Registro'}
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
  );
};