import { useState, useRef } from 'react';
import { useCsvTemplates, useDownloadCsvTemplate, useCsvImport } from '../../hooks/useCsvImport';
import type { CsvTemplate, CsvImportResult } from '@vcm/shared';

export function CsvImportPage() {
  const { data: templates, isLoading } = useCsvTemplates();
  const downloadMutation = useDownloadCsvTemplate();
  const importMutation = useCsvImport();

  const [selectedTemplate, setSelectedTemplate] = useState<CsvTemplate | null>(null);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTemplate) return;

    setImportResult(null);
    importMutation.mutate(
      { type: selectedTemplate.type, file },
      {
        onSuccess: (result) => {
          setImportResult(result);
        },
      },
    );

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">CSV Import</h1>
      <p className="text-gray-500 text-sm mb-6">
        Download CSV templates, fill them with your data, and upload them to batch-import records into the league.
      </p>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {templates?.map((template) => (
          <div
            key={template.type}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition-colors ${
              selectedTemplate?.type === template.type
                ? 'border-indigo-600'
                : 'border-transparent hover:border-gray-200'
            }`}
            onClick={() => {
              setSelectedTemplate(template);
              setImportResult(null);
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900">{template.label}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadMutation.mutate(template.type);
                }}
                disabled={downloadMutation.isPending}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium shrink-0 ml-2"
              >
                {downloadMutation.isPending ? 'Downloading...' : 'Download Template'}
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{template.description}</p>
          </div>
        ))}
      </div>

      {/* Selected Template Detail */}
      {selectedTemplate && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Import: {selectedTemplate.label}
          </h2>
          <p className="text-sm text-gray-500 mb-4">{selectedTemplate.description}</p>

          {/* Column Preview */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Expected Columns</h3>
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplate.headers.map((header) => (
                <span
                  key={header}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-mono"
                >
                  {header}
                </span>
              ))}
            </div>
          </div>

          {/* Sample Data Preview */}
          <div className="mb-6 overflow-x-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Sample Data</h3>
            <table className="text-xs border border-gray-200 rounded">
              <thead>
                <tr className="bg-gray-50">
                  {selectedTemplate.headers.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium text-gray-600 border-b border-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedTemplate.sampleRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-b-0">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-gray-700 font-mono whitespace-nowrap">
                        {cell || <span className="text-gray-300 italic">empty</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* File Upload */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={() => downloadMutation.mutate(selectedTemplate.type)}
              disabled={downloadMutation.isPending}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Template
            </button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
                  importMutation.isPending
                    ? 'bg-indigo-400 text-white cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {importMutation.isPending ? 'Importing...' : 'Upload CSV'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && <ImportResultPanel result={importResult} />}

      {/* Import Error */}
      {importMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            Import failed: {importMutation.error?.message || 'Unknown error'}
          </p>
        </div>
      )}
    </div>
  );
}

function ImportResultPanel({ result }: { result: CsvImportResult }) {
  const [showErrors, setShowErrors] = useState(false);
  const allSuccess = result.errorCount === 0;

  return (
    <div
      className={`rounded-lg border p-4 ${
        allSuccess ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {allSuccess ? (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )}
        <h3 className={`font-medium ${allSuccess ? 'text-green-800' : 'text-yellow-800'}`}>
          Import Complete
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500">Total Rows</p>
          <p className="text-lg font-semibold text-gray-900">{result.totalRows}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Succeeded</p>
          <p className="text-lg font-semibold text-green-700">{result.successCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Failed</p>
          <p className="text-lg font-semibold text-red-700">{result.errorCount}</p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div>
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
          >
            {showErrors ? 'Hide' : 'Show'} {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
          </button>

          {showErrors && (
            <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
              {result.errors.map((err, i) => (
                <div key={i} className="text-xs bg-white rounded px-3 py-2 border border-yellow-200">
                  <span className="font-medium text-gray-700">Row {err.row}</span>
                  {err.field && (
                    <span className="text-gray-400 ml-1">({err.field})</span>
                  )}
                  <span className="text-gray-500 ml-1">— {err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
