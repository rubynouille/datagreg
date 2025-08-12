"use client";

import { useState } from "react";
import { DatasetPair } from "@/lib/types";

interface PairItemProps {
  pair: DatasetPair;
  onEdit: (pair: DatasetPair) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
  onSave?: (id: string, input: string, output: string) => void;
  onCancelEdit?: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function PairItem({ 
  pair, 
  onEdit, 
  onDelete, 
  isEditing = false, 
  onSave, 
  onCancelEdit, 
  isUpdating = false, 
  isDeleting = false 
}: PairItemProps) {
  const [editForm, setEditForm] = useState({ input: pair.input, output: pair.output });

  function handleSave() {
    if (onSave && editForm.input.trim() && editForm.output.trim()) {
      onSave(pair.id, editForm.input, editForm.output);
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all duration-200">
      {isEditing ? (
        // Edit Mode
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`edit-input-${pair.id}`} className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Input
              </label>
              <textarea
                id={`edit-input-${pair.id}`}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                value={editForm.input}
                onChange={(e) => setEditForm({ ...editForm, input: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label htmlFor={`edit-output-${pair.id}`} className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Output
              </label>
              <textarea
                id={`edit-output-${pair.id}`}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-3 text-sm bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                value={editForm.output}
                onChange={(e) => setEditForm({ ...editForm, output: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              disabled={isUpdating || !editForm.input.trim() || !editForm.output.trim()}
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-4">
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h2m0-18h8a2 2 0 012 2v4.586a1 1 0 01-.293.707l-2.414 2.414a1 1 0 00-.293.707V16a2 2 0 01-2 2h-4m-5-6h10m-10-4h10" />
                </svg>
                Input
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">{pair.input}</pre>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Output
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">{pair.output}</pre>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Added {new Date(pair.createdAt).toLocaleDateString()} • ID: {pair.id.slice(-8)}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(pair)}
                className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                disabled={isDeleting}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => onDelete(pair.id)}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
