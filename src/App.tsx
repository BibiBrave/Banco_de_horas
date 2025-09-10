import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useTimeBank } from './hooks/useTimeBank';
import { Dashboard } from './components/Dashboard';
import { TimeEntryForm } from './components/TimeEntryForm';
import { TimeEntryList } from './components/TimeEntryList';
import { ImportSpreadsheet } from './components/ImportSpreadsheet';
import { Settings } from './components/Settings';
import { TimeEntry } from './types/timebank';
import { calculateSummary } from './utils/timeCalculations';

function App() {
  const { entries, settings, loading, addEntry, addMultipleEntries, updateEntry, deleteEntry, updateSettings } = useTimeBank();
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summary = calculateSummary(entries);

  const handleAddEntry = (entryData: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>) => {
    addEntry(entryData);
  };

  const handleImportEntries = (entriesData: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>[]) => {
    const importedCount = addMultipleEntries(entriesData);
    alert(`${importedCount} registros foram importados com sucesso!`);
  };
  const handleUpdateEntry = (entryData: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>) => {
    if (editingEntry) {
      updateEntry(editingEntry.id, entryData);
      setEditingEntry(null);
    }
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Banco de Horas</h1>
              <p className="text-gray-600">Controle e acompanhe seu saldo de horas trabalhadas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard summary={summary} />
        
        <div className="mb-8">
          {editingEntry ? (
            <TimeEntryForm 
              onSubmit={handleUpdateEntry}
              settings={settings}
              editingEntry={editingEntry}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <TimeEntryForm 
                  onSubmit={handleAddEntry}
                  settings={settings}
                />
                <ImportSpreadsheet onImport={handleImportEntries} />
              </div>
            </div>
          )}
        </div>
        
        <TimeEntryList 
          entries={entries}
          onEdit={handleEditEntry}
          onDelete={deleteEntry}
        />
      </main>

      <Settings 
        settings={settings}
        onUpdate={updateSettings}
      />
    </div>
  );
}

export default App;