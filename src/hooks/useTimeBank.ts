import { useState, useEffect } from 'react';
import { TimeEntry, WorkSettings } from '../types/timebank';
import { calculateWorkedHours, calculateBalance } from '../utils/timeCalculations';

const STORAGE_KEYS = {
  TIME_ENTRIES: 'timebank_entries',
  WORK_SETTINGS: 'timebank_settings',
};

const DEFAULT_SETTINGS: WorkSettings = {
  defaultContractualHours: 8,
  lunchBreakMinutes: 60,
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
};

export const useTimeBank = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<WorkSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEYS.TIME_ENTRIES);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.WORK_SETTINGS);

    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Error parsing saved entries:', error);
      }
    }

    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }

    setLoading(false);
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.TIME_ENTRIES, JSON.stringify(entries));
    }
  }, [entries, loading]);

  // Save settings to localStorage
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEYS.WORK_SETTINGS, JSON.stringify(settings));
    }
  }, [settings, loading]);

  const addEntry = (entryData: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>) => {
    const workedHours = calculateWorkedHours(
      entryData.checkIn,
      entryData.checkOut,
      entryData.lunchOut,
      entryData.lunchIn
    );
    
    const balance = calculateBalance(workedHours, entryData.contractualHours);

    const newEntry: TimeEntry = {
      ...entryData,
      id: Date.now().toString(),
      workedHours,
      balance,
    };

    setEntries(prev => [newEntry, ...prev].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  const addMultipleEntries = (entriesData: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>[]) => {
    const newEntries: TimeEntry[] = entriesData.map((entryData, index) => {
      const workedHours = calculateWorkedHours(
        entryData.checkIn,
        entryData.checkOut,
        entryData.lunchOut,
        entryData.lunchIn
      );
      
      const balance = calculateBalance(workedHours, entryData.contractualHours);

      return {
        ...entryData,
        id: (Date.now() + index).toString(),
        workedHours,
        balance,
      };
    });

    setEntries(prev => {
      // Filtrar entradas duplicadas por data
      const existingDates = new Set(prev.map(entry => entry.date));
      const uniqueNewEntries = newEntries.filter(entry => !existingDates.has(entry.date));
      
      return [...uniqueNewEntries, ...prev].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    return newEntries.length - (newEntries.length - newEntries.filter(entry => 
      !entries.some(existing => existing.date === entry.date)
    ).length);
  };
  const updateEntry = (id: string, entryData: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>) => {
    const workedHours = calculateWorkedHours(
      entryData.checkIn,
      entryData.checkOut,
      entryData.lunchOut,
      entryData.lunchIn
    );
    
    const balance = calculateBalance(workedHours, entryData.contractualHours);

    setEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, ...entryData, workedHours, balance }
        : entry
    ));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const updateSettings = (newSettings: WorkSettings) => {
    setSettings(newSettings);
  };

  return {
    entries,
    settings,
    loading,
    addEntry,
    addMultipleEntries,
    updateEntry,
    deleteEntry,
    updateSettings,
  };
};