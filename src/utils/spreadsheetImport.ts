import * as XLSX from 'xlsx';
import { TimeEntry } from '../types/timebank';
import { calculateWorkedHours, calculateBalance } from './timeCalculations';

export interface ImportResult {
  success: boolean;
  entries: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export interface SpreadsheetRow {
  data: string;
  entrada: string;
  saida_almoco?: string;
  volta_almoco?: string;
  saida: string;
  horas_contratuais?: number;
  observacoes?: string;
}

const parseDate = (dateValue: any): string | null => {
  if (!dateValue) return null;
  
  // Se já é uma string no formato correto
  if (typeof dateValue === 'string') {
    // Tenta diferentes formatos de data
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      if (format.test(dateValue)) {
        if (dateValue.includes('/')) {
          const [day, month, year] = dateValue.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        } else if (dateValue.includes('-') && dateValue.length === 10) {
          if (dateValue.startsWith('20')) {
            return dateValue; // Já está no formato correto
          } else {
            const [day, month, year] = dateValue.split('-');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
      }
    }
  }
  
  // Se é um número (data do Excel)
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  // Se é um objeto Date
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  
  return null;
};

const parseTime = (timeValue: any): string | null => {
  if (!timeValue) return null;
  
  if (typeof timeValue === 'string') {
    // Remove espaços e verifica formato HH:MM
    const cleaned = timeValue.trim();
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [hours, minutes] = cleaned.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
  }
  
  // Se é um número decimal (formato Excel para tempo)
  if (typeof timeValue === 'number') {
    const totalMinutes = Math.round(timeValue * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return null;
};

const validateRow = (row: any, rowIndex: number): { isValid: boolean; errors: string[]; data?: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'> } => {
  const errors: string[] = [];
  
  // Mapear diferentes possíveis nomes de colunas
  const dateValue = row['Data'] || row['data'] || row['DATE'] || row['Data do Ponto'] || row['A'];
  const checkInValue = row['Entrada'] || row['entrada'] || row['CHECK_IN'] || row['Horário Entrada'] || row['B'];
  const lunchOutValue = row['Saída Almoço'] || row['saida_almoco'] || row['LUNCH_OUT'] || row['Saída para Almoço'] || row['C'];
  const lunchInValue = row['Volta Almoço'] || row['volta_almoco'] || row['LUNCH_IN'] || row['Volta do Almoço'] || row['D'];
  const checkOutValue = row['Saída'] || row['saida'] || row['CHECK_OUT'] || row['Horário Saída'] || row['E'];
  const contractualHoursValue = row['Horas Contratuais'] || row['horas_contratuais'] || row['CONTRACTUAL_HOURS'] || row['Carga Horária'] || row['F'];
  const notesValue = row['Observações'] || row['observacoes'] || row['NOTES'] || row['Obs'] || row['G'];
  
  // Validar data
  const date = parseDate(dateValue);
  if (!date) {
    errors.push(`Linha ${rowIndex + 2}: Data inválida ou ausente`);
  }
  
  // Validar horários obrigatórios
  const checkIn = parseTime(checkInValue);
  if (!checkIn) {
    errors.push(`Linha ${rowIndex + 2}: Horário de entrada inválido ou ausente`);
  }
  
  const checkOut = parseTime(checkOutValue);
  if (!checkOut) {
    errors.push(`Linha ${rowIndex + 2}: Horário de saída inválido ou ausente`);
  }
  
  // Validar horários de almoço (opcionais, mas se um estiver presente, ambos devem estar)
  const lunchOut = parseTime(lunchOutValue);
  const lunchIn = parseTime(lunchInValue);
  
  if ((lunchOut && !lunchIn) || (!lunchOut && lunchIn)) {
    errors.push(`Linha ${rowIndex + 2}: Se informado horário de almoço, tanto saída quanto volta devem ser preenchidos`);
  }
  
  // Validar horas contratuais
  let contractualHours = 8; // Padrão
  if (contractualHoursValue !== undefined && contractualHoursValue !== null && contractualHoursValue !== '') {
    const parsed = parseFloat(contractualHoursValue.toString());
    if (isNaN(parsed) || parsed < 0 || parsed > 24) {
      errors.push(`Linha ${rowIndex + 2}: Horas contratuais inválidas (deve ser entre 0 e 24)`);
    } else {
      contractualHours = parsed;
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  return {
    isValid: true,
    errors: [],
    data: {
      date: date!,
      checkIn: checkIn!,
      lunchOut: lunchOut || undefined,
      lunchIn: lunchIn || undefined,
      checkOut: checkOut!,
      contractualHours,
      notes: notesValue ? notesValue.toString().trim() : undefined,
    }
  };
};

export const importFromSpreadsheet = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Pega a primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false 
        });
        
        if (jsonData.length < 2) {
          resolve({
            success: false,
            entries: [],
            errors: ['A planilha deve conter pelo menos uma linha de cabeçalho e uma linha de dados'],
            totalRows: 0,
            validRows: 0,
          });
          return;
        }
        
        // Primeira linha como cabeçalho
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        // Converte para objetos
        const objects = rows.map((row: any[]) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        
        const validEntries: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>[] = [];
        const allErrors: string[] = [];
        
        objects.forEach((row, index) => {
          // Pula linhas completamente vazias
          const hasData = Object.values(row).some(value => 
            value !== undefined && value !== null && value.toString().trim() !== ''
          );
          
          if (!hasData) return;
          
          const validation = validateRow(row, index);
          if (validation.isValid && validation.data) {
            validEntries.push(validation.data);
          } else {
            allErrors.push(...validation.errors);
          }
        });
        
        resolve({
          success: allErrors.length === 0,
          entries: validEntries,
          errors: allErrors,
          totalRows: objects.length,
          validRows: validEntries.length,
        });
        
      } catch (error) {
        resolve({
          success: false,
          entries: [],
          errors: [`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
          totalRows: 0,
          validRows: 0,
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        entries: [],
        errors: ['Erro ao ler o arquivo'],
        totalRows: 0,
        validRows: 0,
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const downloadTemplate = () => {
  const templateData = [
    ['Data', 'Entrada', 'Saída Almoço', 'Volta Almoço', 'Saída', 'Horas Contratuais', 'Observações'],
    ['2024-01-15', '09:00', '12:00', '13:00', '18:00', 8, 'Exemplo de registro'],
    ['2024-01-16', '08:30', '12:30', '13:30', '17:30', 8, ''],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros de Ponto');
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 12 }, // Data
    { wch: 10 }, // Entrada
    { wch: 12 }, // Saída Almoço
    { wch: 12 }, // Volta Almoço
    { wch: 10 }, // Saída
    { wch: 15 }, // Horas Contratuais
    { wch: 20 }, // Observações
  ];
  worksheet['!cols'] = colWidths;
  
  XLSX.writeFile(workbook, 'modelo_banco_de_horas.xlsx');
};