"use client";

import { useState } from "react";

interface PairFormProps {
  onSubmit: (input: string, output: string) => Promise<void>;
  loading?: boolean;
  pairCount?: number;
}

export function PairForm({ onSubmit, loading = false, pairCount = 0 }: PairFormProps) {
  const [form, setForm] = useState({ input: "", output: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.input.trim() || !form.output.trim()) return;
    
    await onSubmit(form.input, form.output);
    setForm({ input: "", output: "" });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 sm:p-8">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add New Pair
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <label 
              htmlFor="input-field"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h2m0-18h8a2 2 0 012 2v4.586a1 1 0 01-.293.707l-2.414 2.414a1 1 0 00-.293.707V16a2 2 0 01-2 2h-4m-5-6h10m-10-4h10" />
              </svg>
              Input
            </label>
            <textarea
              id="input-field"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-4 min-h-32 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              value={form.input}
              onChange={(e) => setForm((s) => ({ ...s, input: e.target.value }))}
              placeholder="Enter the input prompt or source text..."
              aria-describedby="input-help"
            />
            <div id="input-help" className="sr-only">
              Enter the input text for this training pair
            </div>
          </div>
          
          <div className="space-y-2">
            <label 
              htmlFor="output-field"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Output
            </label>
            <textarea
              id="output-field"
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-4 min-h-32 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              value={form.output}
              onChange={(e) => setForm((s) => ({ ...s, output: e.target.value }))}
              placeholder="Enter the expected model response or target text..."
              aria-describedby="output-help"
            />
            <div id="output-help" className="sr-only">
              Enter the expected output text for this training pair
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pairCount} pair{pairCount === 1 ? "" : "s"} in dataset
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            disabled={!form.input.trim() || !form.output.trim() || loading}
          >
            {loading ? "Adding..." : "Add Pair"}
          </button>
        </div>
      </form>
    </div>
  );
}
