'use client';

import { useState } from 'react';
import Papa from 'papaparse';

interface CSVRow {
  numbershort: string;
  number: string;
  'product name': string;
  condition: string;
  'qty': string;
  rarity: string;
  set: string;
  notes: string;
}

export default function Home() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const results = await new Promise<Papa.ParseResult<CSVRow>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => value.trim(),
          complete: (results: Papa.ParseResult<CSVRow>) => resolve(results),
          error: (error: any) => reject(error),
        });
      });

      if (results.errors.length > 0) {
        setError(results.errors[0].message);
        return;
      }

      setError('');
      
      // Filter out any rows containing "Orders Contained in Pull Sheet" and transform the data
      const transformedData = results.data
        .filter((row: any) => {
          // Check if any value in the row contains the unwanted text
          return !Object.values(row).some((value: any) => {
            // Only check if the value is a string
            if (typeof value === 'string') {
              const lowerValue = value.toLowerCase();
              return lowerValue.includes('orders contained in pull sheet') || lowerValue.includes('pull sheet');
            }
            return false;
          });
        })
        .map((row: any) => {
          const number = row['Number'];
          const numbershort = number?.split('-')[1] || '';
          const quantity = row['Quantity'] || '1';
          
          return {
            numbershort,
            number,
            'product name': row['Product Name'] || '',
            condition: row['Condition'] || '',
            'qty': quantity,
            rarity: row['Rarity'] || '',
            set: row['Set'] || '',
            notes: '',
          };
        })
        // Sort the data: first by set, then rarity, then condition, then product name
        .sort((a, b) => {
          // First compare by set
          if (a.set !== b.set) {
            return a.set.localeCompare(b.set);
          }

          // Then by rarity
          if (a.rarity !== b.rarity) {
            return a.rarity.localeCompare(b.rarity);
          }

          // Then by condition
          if (a.condition !== b.condition) {
            return a.condition.localeCompare(b.condition);
          }

          // Finally by product name
          return a['product name'].localeCompare(b['product name']);
        });

      setCsvData(transformedData);

    } catch (err) {
      setError('Error processing CSV file');
    }
  };

  const downloadCSV = () => {
    const csvContent = Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sorted_cards.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">CSV Sorter</h1>
      
      <div className="max-w-4xl w-full">
        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="border-2 border-gray-300 p-2 rounded"
          />
        </div>
        {csvData.length > 0 && (
          <button
            onClick={downloadCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mt-4"
          >
            Download Sorted CSV
          </button>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {csvData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">numbershort</th>
                  <th className="border px-4 py-2">number</th>
                  <th className="border px-4 py-2">product name</th>
                  <th className="border px-4 py-2">condition</th>
                  <th className="border px-4 py-2">qty</th>
                  <th className="border px-4 py-2">rarity</th>
                  <th className="border px-4 py-2">set</th>
                  <th className="border px-4 py-2">notes</th>
                </tr>
              </thead>
              <tbody>
                {csvData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border px-4 py-2">{row.numbershort}</td>
                    <td className="border px-4 py-2">{row.number}</td>
                    <td className="border px-4 py-2">{row['product name']}</td>
                    <td className="border px-4 py-2">{row.condition}</td>
                    <td className="border px-4 py-2">{row.qty}</td>
                    <td className="border px-4 py-2">{row.rarity}</td>
                    <td className="border px-4 py-2">{row.set}</td>
                    <td className="border px-4 py-2">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
