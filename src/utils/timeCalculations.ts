import { TimeEntry } from '../types/timebank';

export const calculateWorkedHours = (
  checkIn: string,
  checkOut: string,
  lunchOut?: string,
  lunchIn?: string
): number => {
  const checkInTime = parseTime(checkIn);
  const checkOutTime = parseTime(checkOut);
  
  let totalMinutes = checkOutTime - checkInTime;
  
  // Subtract lunch break if provided
  if (lunchOut && lunchIn) {
    const lunchOutTime = parseTime(lunchOut);
    const lunchInTime = parseTime(lunchIn);
    const lunchBreak = lunchInTime - lunchOutTime;
    totalMinutes -= lunchBreak;
  }
  
  return Math.max(0, totalMinutes / 60);
};

export const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatHours = (hours: number): string => {
  const isNegative = hours < 0;
  const absHours = Math.abs(hours);
  const h = Math.floor(absHours);
  const m = Math.round((absHours - h) * 60);
  
  const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  return isNegative ? `-${formatted}` : formatted;
};

export const calculateBalance = (workedHours: number, contractualHours: number): number => {
  return workedHours - contractualHours;
};

export const calculateSummary = (entries: TimeEntry[]) => {
  const totalBalance = entries.reduce((sum, entry) => sum + entry.balance, 0);
  const totalWorkedHours = entries.reduce((sum, entry) => sum + entry.workedHours, 0);
  const totalContractualHours = entries.reduce((sum, entry) => sum + entry.contractualHours, 0);
  const averageWorkedHours = entries.length > 0 ? totalWorkedHours / entries.length : 0;
  
  return {
    totalBalance,
    totalWorkedHours,
    totalContractualHours,
    averageWorkedHours,
    daysWorked: entries.length,
  };
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};