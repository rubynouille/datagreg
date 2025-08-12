"use client";

import { useState } from "react";
import { ExportFormat } from "@/lib/types";

interface ImportSectionProps {
  onImport: (format: ExportFormat, jsonl: string) => Promise<void>;
  loading?: boolean;
  result?: string;
}

export function ImportSection({ onImport, loading = false, result = "" }: ImportSectionProps) {
  const [importText, setImportText] = useState<string>("");
  const [importFormat, setImportFormat] = useState<ExportFormat>("gemini");

  async function handleImport() {
    if (!importText.trim()) return;
    await onImport(importFormat, importText);
    setImportText("");
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Import JSONL
        </h2>
        <div className="flex items-center gap-2">
          <label htmlFor="import-format" className="sr-only">Import format</label>
          <select
            id="import-format"
            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={importFormat}
            onChange={(e) => setImportFormat(e.target.value as ExportFormat)}
          >
            <option value="gemini">Gemini JSONL</option>
            <option value="openai_chat">OpenAI Chat JSONL</option>
          </select>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            onClick={handleImport}
            disabled={!importText.trim() || loading}
          >
            {loading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
      <textarea
        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-4 min-h-32 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-y font-mono"
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder="Paste JSONL content here..."
        aria-label="JSONL content to import"
      />
      {result && (
        <p className="text-sm mt-2 text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
          {result}
        </p>
      )}
    </div>
  );
}
