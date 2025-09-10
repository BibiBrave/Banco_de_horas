import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { importFromSpreadsheet, downloadTemplate, ImportResult } from '../utils/spreadsheetImport';
import { TimeEntry } from '../types/timebank';

interface ImportSpreadsheetProps {
  onImport: (entries: Omit<TimeEntry, 'id' | 'workedHours' | 'balance'>[]) => void;
}

export const ImportSpreadsheet: React.FC<ImportSpreadsheetProps> = ({ onImport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const result = await importFromSpreadsheet(file);
      setImportResult(result);
    } catch (error) {
      setImportResult({
        success: false,
        entries: [],
        errors: [`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        totalRows: 0,
        validRows: 0,
      });
    } finally {
      setImporting(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (importResult && importResult.entries.length > 0) {
      onImport(importResult.entries);
      setIsOpen(false);
      setImportResult(null);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setImportResult(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 shadow-md hover:shadow-lg"
      >
        <Upload className="w-4 h-4" />
        Importar Planilha
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Importar Registros de Planilha</h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!importResult && (
            <>
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Como usar:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Baixe o modelo de planilha clicando no botão abaixo</li>
                  <li>Preencha os dados seguindo o formato do exemplo</li>
                  <li>Salve o arquivo e faça o upload aqui</li>
                  <li>Revise os dados importados antes de confirmar</li>
                </ol>
              </div>

              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Baixar Modelo de Planilha
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione sua planilha
                </h4>
                <p className="text-gray-600 mb-4">
                  Arquivos suportados: Excel (.xlsx, .xls) ou CSV (.csv)
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors duration-200"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Selecionar Arquivo
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Formato esperado:</h5>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Data:</strong> DD/MM/AAAA ou AAAA-MM-DD</p>
                  <p><strong>Horários:</strong> HH:MM (formato 24h)</p>
                  <p><strong>Horas Contratuais:</strong> Número decimal (ex: 8, 7.5)</p>
                  <p><strong>Almoço:</strong> Opcional, mas se informado, preencher saída E volta</p>
                </div>
              </div>
            </>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                importResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h4 className={`font-medium ${
                    importResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {importResult.success ? 'Importação bem-sucedida!' : 'Problemas encontrados'}
                  </h4>
                </div>
                
                <div className={`text-sm ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  <p>Total de linhas processadas: {importResult.totalRows}</p>
                  <p>Registros válidos: {importResult.validRows}</p>
                  {importResult.errors.length > 0 && (
                    <p>Erros encontrados: {importResult.errors.length}</p>
                  )}
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-900 mb-2">Erros encontrados:</h5>
                  <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.validRows > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-2">
                    Prévia dos registros que serão importados ({importResult.validRows}):
                  </h5>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="text-left p-2 text-blue-900">Data</th>
                          <th className="text-left p-2 text-blue-900">Entrada</th>
                          <th className="text-left p-2 text-blue-900">Saída</th>
                          <th className="text-left p-2 text-blue-900">H. Contratuais</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.entries.slice(0, 10).map((entry, index) => (
                          <tr key={index} className="border-b border-blue-200">
                            <td className="p-2 text-blue-800">
                              {new Date(entry.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-2 text-blue-800">{entry.checkIn}</td>
                            <td className="p-2 text-blue-800">{entry.checkOut}</td>
                            <td className="p-2 text-blue-800">{entry.contractualHours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importResult.entries.length > 10 && (
                      <p className="text-xs text-blue-600 mt-2 text-center">
                        ... e mais {importResult.entries.length - 10} registros
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {importResult.validRows > 0 && (
                  <button
                    onClick={handleConfirmImport}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Confirmar Importação ({importResult.validRows} registros)
                  </button>
                )}
                
                <button
                  onClick={handleCancel}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {importResult.validRows > 0 ? 'Cancelar' : 'Fechar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};