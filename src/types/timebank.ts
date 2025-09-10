export interface TimeEntry {
  id: string;
  date: string;
  checkIn: string;
  lunchOut?: string;
  lunchIn?: string;
  checkOut: string;
  workedHours: number;
  contractualHours: number;
  balance: number;
  notes?: string;
}

export interface TimeBankSummary {
  totalBalance: number;
  totalWorkedHours: number;
  totalContractualHours: number;
  averageWorkedHours: number;
  daysWorked: number;
}

export interface WorkSettings {
  defaultContractualHours: number;
  lunchBreakMinutes: number;
  workDays: string[];
}