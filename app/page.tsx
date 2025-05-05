'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface CSVRow {
  [key: string]: string | number | boolean;
}

interface PapaParseResult {
  data: CSVRow[];
  errors: any[];
  meta: any;
}

export default function Home() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sortColumns, setSortColumns] = useState<{ column: string; order: 'asc' | 'desc' }[]>([]);
  const [sortedData, setSortedData] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results: PapaParseResult) => {
        // Remove the row containing "Orders Contained in Pull Sheet"
        const filteredData = results.data.filter((row: CSVRow) => {
          return !Object.values(row).some((value: string | number | boolean) => 
            typeof value === 'string' && value.includes('Orders Contained in Pull Sheet')
          );
        });
        
        setCsvData(filteredData);
        setHeaders(Object.keys(filteredData[0]));
      },
      error: (err) => setError('Error parsing CSV file'),
    });
  };

  const addSortColumn = (column: string, order: 'asc' | 'desc') => {
    if (!column) return;
    
    // Remove existing sort for this column
    const existingIndex = sortColumns.findIndex(c => c.column === column);
    if (existingIndex !== -1) {
      sortColumns.splice(existingIndex, 1);
    }
    
    // Add new sort column
    setSortColumns([...sortColumns, { column, order }]);
  };

  const removeSortColumn = (index: number) => {
    const newSortColumns = [...sortColumns];
    newSortColumns.splice(index, 1);
    setSortColumns(newSortColumns);
  };

  const handleSort = () => {
    if (!csvData.length) return;

    const sorted = [...csvData].sort((a, b) => {
      for (const { column, order } of sortColumns) {
        const aValue = a[column];
        const bValue = b[column];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const result = order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          if (result !== 0) return result;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          const result = order === 'asc' ? aValue - bValue : bValue - aValue;
          if (result !== 0) return result;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          const result = order === 'asc' ? (aValue ? 1 : 0) - (bValue ? 1 : 0) : (bValue ? 1 : 0) - (aValue ? 1 : 0);
          if (result !== 0) return result;
        } else {
          // For mixed types or undefined values, sort by string representation
          const aStr = String(aValue);
          const bStr = String(bValue);
          const result = order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
          if (result !== 0) return result;
        }
      }
      return 0;
    });

    setSortedData(sorted);
  };

  const downloadSortedCSV = () => {
    if (!sortedData.length) return;

    const csv = Papa.unparse(sortedData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sorted-data.csv';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">CSV Sorter</h1>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {csvData.length > 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold mb-2">Sort Columns</h2>
              <div className="space-y-2">
                <div className="flex gap-3 items-center">
                  <select
                    onChange={(e) => setSortColumns([{ column: e.target.value, order: 'asc' }])}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Primary Sort Column</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <select
                    onChange={(e) => {
                      const current = sortColumns[0];
                      if (current) {
                        setSortColumns([{ ...current, order: e.target.value as 'asc' | 'desc' }]);
                      }
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                <div className="flex gap-3 items-center">
                  <select
                    onChange={(e) => {
                      const current = sortColumns[0];
                      if (current) {
                        setSortColumns([
                          current,
                          { column: e.target.value, order: 'asc' }
                        ]);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Secondary Sort Column</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <select
                    onChange={(e) => {
                      const current = sortColumns[1];
                      if (current) {
                        setSortColumns([
                          sortColumns[0],
                          { ...current, order: e.target.value as 'asc' | 'desc' }
                        ]);
                      }
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                <div className="flex gap-3 items-center">
                  <select
                    onChange={(e) => {
                      const current = sortColumns[1];
                      if (current) {
                        setSortColumns([
                          sortColumns[0],
                          current,
                          { column: e.target.value, order: 'asc' }
                        ]);
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tertiary Sort Column</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <select
                    onChange={(e) => {
                      const current = sortColumns[2];
                      if (current) {
                        setSortColumns([
                          sortColumns[0],
                          sortColumns[1],
                          { ...current, order: e.target.value as 'asc' | 'desc' }
                        ]);
                      }
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              {sortColumns.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-semibold">Current Sort Order:</h3>
                  <div className="space-y-2">
                    {sortColumns.map((sort, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0" />
                          <span>{sort.column}</span>
                          <span className="text-sm">({sort.order === 'asc' ? 'asc' : 'desc'})</span>
                        </span>
                        <button
                          onClick={() => {
                            setSortColumns(sortColumns.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSort}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Sort Data
            </button>

            {sortedData.length > 0 && (
              <button
                onClick={downloadSortedCSV}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                Download Sorted CSV
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
