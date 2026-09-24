'use client';

import { useState, useRef, FormEvent } from 'react';
import Link from 'next/link';

interface ImportRow {
  hospitalName: string;
  name: string;
  price: string;
  currency: string;
  duration: string;
  items: string;
  description: string;
  source: string;
  tags: string;
  includesTranslator: string;
}

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    hospitalName: 'hospitalName',
    name: 'name',
    price: 'price',
    currency: 'currency',
    duration: 'duration',
    items: 'items',
    description: 'description',
    source: 'source',
    tags: 'tags',
    includesTranslator: 'includesTranslator',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    try {
      const buf = await f.arrayBuffer();
      // Use SheetJS from local node_modules via dynamic import
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buf, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

      if (json.length < 2) {
        setResult({ success: 0, failed: 0, errors: ['Excel file is empty or has only headers'] });
        return;
      }

      const headers = json[0] as string[];
      const dataRows = json.slice(1) as string[][];

      // Auto-detect column mapping
      const headerLower = headers.map(h => h.toLowerCase().replace(/[\s\-_]/g, ''));
      const autoMap: Record<string, string> = {};
      const fieldKeys = ['hospitalName', 'name', 'price', 'currency', 'duration', 'items', 'description', 'source', 'tags', 'includesTranslator'];
      const fieldPatterns: Record<string, string[]> = {
        hospitalName: ['hospitalname', 'hospital', 'hospital_name', '医院'],
        name: ['name', 'packagename', 'package_name', '套餐名称', '套餐名'],
        price: ['price', 'cost', 'amount', '价格', '费用'],
        currency: ['currency', '币种', '货币'],
        duration: ['duration', 'time', '时长', '时间'],
        items: ['items', '检查项目', '项目'],
        description: ['description', 'desc', '描述', '说明'],
        source: ['source', 'sourceurl', 'source_url', '出处', '来源', '来源链接'],
        tags: ['tags', 'tag', '标签', '分类'],
        includesTranslator: ['includestranslator', 'translator', '翻译', 'translation'],
      };

      for (let i = 0; i < headers.length; i++) {
        const hl = headerLower[i];
        for (const key of fieldKeys) {
          if (fieldPatterns[key].includes(hl)) {
            autoMap[key] = headers[i];
            break;
          }
        }
      }
      if (Object.keys(autoMap).length > 0) setColumnMap(prev => ({ ...prev, ...autoMap }));

      // Parse rows
      const parsed: ImportRow[] = dataRows.map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = row[i] || ''; });
        return {
          hospitalName: obj[autoMap.hospitalName || headers[0]] || '',
          name: obj[autoMap.name || headers[1]] || '',
          price: obj[autoMap.price || ''] || '',
          currency: obj[autoMap.currency || ''] || 'CNY',
          duration: obj[autoMap.duration || ''] || '',
          items: obj[autoMap.items || ''] || '',
          description: obj[autoMap.description || ''] || '',
          source: obj[autoMap.source || ''] || '',
          tags: obj[autoMap.tags || ''] || '',
          includesTranslator: obj[autoMap.includesTranslator || ''] || 'false',
        };
      });

      setRows(parsed.filter(r => r.name.trim()));
    } catch (err) {
      setResult({ success: 0, failed: 0, errors: [`Error parsing file: ${err instanceof Error ? err.message : 'Unknown error'}`] });
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, columnMap }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success > 0) setRows([]);
    } catch (err) {
      setResult({ success: 0, failed: rows.length, errors: [err instanceof Error ? err.message : 'Network error'] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-primary hover:underline">← Back to Dashboard</Link>
        <h1 className="text-2xl font-bold mt-2">Batch Import Data</h1>
        <p className="text-muted-foreground mt-1">Upload an Excel (.xlsx / .xls) file to batch import hospitals and checkup packages.</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">1. Upload Excel File</h2>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          {!file ? (
            <div>
              <p className="text-muted-foreground mb-4">Drag & drop or click to select an Excel file</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                Select File
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
              <p className="text-xs text-muted-foreground mb-3">{rows.length} rows parsed</p>
              <button onClick={() => { setFile(null); setRows([]); setResult(null); }} className="text-sm text-primary hover:underline">
                Remove & select another file
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 bg-muted rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">📋 Excel Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>First row must be column headers</li>
            <li>Required columns: <code className="bg-background px-1 rounded">hospitalName</code>, <code className="bg-background px-1 rounded">name</code>, <code className="bg-background px-1 rounded">price</code></li>
            <li>Optional: <code className="bg-background px-1 rounded">currency</code>, <code className="bg-background px-1 rounded">duration</code>, <code className="bg-background px-1 rounded">items</code> (comma separated), <code className="bg-background px-1 rounded">description</code>, <code className="bg-background px-1 rounded">tags</code> (comma separated), <code className="bg-background px-1 rounded">includesTranslator</code> (true/false)</li>
            <li>If hospital doesn&apos;t exist, it will be automatically created</li>
            <li>Duplicates will be skipped</li>
          </ul>
        </div>
      </div>

      {/* Preview Section */}
      {rows.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">2. Preview ({rows.length} rows)</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left font-medium">#</th>
                  <th className="p-2 text-left font-medium">Hospital</th>
                  <th className="p-2 text-left font-medium">Package</th>
                  <th className="p-2 text-left font-medium">Price</th>
                  <th className="p-2 text-left font-medium">Currency</th>
                  <th className="p-2 text-left font-medium">Duration</th>
                  <th className="p-2 text-left font-medium">Translator</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/50">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2">{row.hospitalName}</td>
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="p-2">{row.price}</td>
                    <td className="p-2">{row.currency}</td>
                    <td className="p-2">{row.duration}</td>
                    <td className="p-2">{row.includesTranslator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 50 && <p className="text-xs text-muted-foreground mb-4">... and {rows.length - 50} more rows</p>}

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? `Importing ${rows.length} rows...` : `Import ${rows.length} Records`}
          </button>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className={`rounded-lg border p-6 ${result.failed === 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <h2 className="text-lg font-semibold mb-2">Import Result</h2>
          <p className="text-sm">✅ Successfully imported: {result.success}</p>
          {result.failed > 0 && <p className="text-sm text-red-600">❌ Failed: {result.failed}</p>}
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-600">Errors:</p>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-1 mt-1">
                {result.errors.slice(0, 20).map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <Link href="/admin" className="inline-block mt-4 text-sm text-primary hover:underline">← Back to Dashboard</Link>
        </div>
      )}
    </div>
  );
}