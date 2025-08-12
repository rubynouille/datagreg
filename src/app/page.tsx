"use client";

import { useEffect, useState, useCallback } from "react";
import { Dataset } from "@/lib/types";
import { DatasetCard } from "@/components/DatasetCard";
import { clientDB } from "@/lib/clientDb";

export default function Home() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [directorySelected, setDirectorySelected] = useState<boolean>(false);
  const [initializingDirectory, setInitializingDirectory] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [rememberFolder, setRememberFolder] = useState<boolean>(false);
  const [checkingStoredDirectory, setCheckingStoredDirectory] = useState<boolean>(false);

  const loadDatasets = useCallback(async () => {
    // Check if directory is actually selected in the clientDB
    if (!clientDB.isDirectorySelected()) {
      // Reset the directorySelected state if the directory handle is lost
      setDirectorySelected(false);
      setLoading(false);
      return;
    }

    // If directory is selected but database not loaded, try to load it
    if (!clientDB.isDatabaseLoaded()) {
      try {
        await clientDB.loadDatabase();
      } catch (error) {
        console.error("Failed to load database:", error);
        setError(error instanceof Error ? error.message : "Failed to load database");
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const datasetList = await clientDB.listDatasets();
      setDatasets(datasetList);
      setDirectorySelected(true);
    } catch (error) {
      if (error instanceof Error && error.message.includes("No directory")) {
        // Directory not selected yet, reset state
        setDirectorySelected(false);
        return;
      }
      console.error("Failed to load datasets:", error);
      setError(error instanceof Error ? error.message : "Failed to load datasets");
    } finally {
      setLoading(false);
    }
  }, []);

  const tryRestoreStoredDirectory = useCallback(async () => {
    setCheckingStoredDirectory(true);
    try {
      const restored = await clientDB.restoreStoredDirectory();
      if (restored) {
        setDirectorySelected(true);
        await loadDatasets();
      } else {
        // No stored directory, try regular load
        await loadDatasets();
      }
    } catch (error) {
      console.error("Failed to restore stored directory:", error);
      setError(error instanceof Error ? error.message : "Failed to restore directory");
      await loadDatasets();
    } finally {
      setCheckingStoredDirectory(false);
    }
  }, [loadDatasets]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if File System Access API is supported
      if (!clientDB.isSupported()) {
        setError(clientDB.getBrowserCompatibilityMessage());
        setLoading(false);
        return;
      }
      
      // First try to restore from stored directory
      tryRestoreStoredDirectory();
    }
  }, [tryRestoreStoredDirectory]);

  async function selectDirectory() {
    setInitializingDirectory(true);
    setError("");
    try {
      await clientDB.initializeDirectory(rememberFolder);
      setDirectorySelected(true);
      await loadDatasets();
    } catch (error) {
      console.error("Failed to initialize directory:", error);
      setError(error instanceof Error ? error.message : "Failed to select directory");
    } finally {
      setInitializingDirectory(false);
    }
  }

  async function resetDirectory() {
    setError("");
    try {
      await clientDB.resetDirectory();
      setDirectorySelected(false);
      setDatasets([]);
      setRememberFolder(false);
    } catch (error) {
      console.error("Failed to reset directory:", error);
      setError(error instanceof Error ? error.message : "Failed to reset directory");
    }
  }

  async function createNewDataset() {
    const name = prompt("Enter dataset name:");
    if (!name || !name.trim()) return;
    
    setCreating(true);
    setError("");
    try {
      await clientDB.createDataset(name.trim());
      await loadDatasets();
    } catch (error) {
      console.error("Failed to create dataset:", error);
      setError(error instanceof Error ? error.message : "Failed to create dataset");
    } finally {
      setCreating(false);
    }
  }

  async function renameDataset(dataset: Dataset) {
    const name = prompt("New dataset name:", dataset.name);
    if (!name || !name.trim()) return;
    
    setError("");
    try {
      await clientDB.updateDataset(dataset.id, { name: name.trim() });
      await loadDatasets();
    } catch (error) {
      console.error("Failed to rename dataset:", error);
      setError(error instanceof Error ? error.message : "Failed to rename dataset");
    }
  }

  async function deleteDataset(dataset: Dataset) {
    if (!confirm(`Delete dataset "${dataset.name}"? This cannot be undone.`)) return;
    
    setError("");
    try {
      await clientDB.deleteDataset(dataset.id);
      await loadDatasets();
    } catch (error) {
      console.error("Failed to delete dataset:", error);
      setError(error instanceof Error ? error.message : "Failed to delete dataset");
    }
  }

  // Show error if File System Access API is not supported
  if (error && error.includes("not supported")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8">
            <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.598 0L4.216 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-4">Browser Not Supported</h2>
            <p className="text-red-700 dark:text-red-300 mb-6">{error}</p>
            <p className="text-red-600 dark:text-red-400">
              This application requires the File System Access API to store data locally on your computer. 
              Please switch to a compatible browser to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show directory selection if not yet selected
  if (!directorySelected && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 p-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              DataGreg
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Select a folder on your computer where your datasets will be stored.
            </p>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            
            {/* Remember folder checkbox */}
            <div className="flex items-center gap-3 mb-6">
              <input
                type="checkbox"
                id="rememberFolder"
                checked={rememberFolder}
                onChange={(e) => setRememberFolder(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="rememberFolder" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Remember this folder (saves folder permission for next time)
              </label>
            </div>
            
            <button
              onClick={selectDirectory}
              disabled={initializingDirectory}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {initializingDirectory ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Initializing...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  Select Data Folder
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              All your data will be stored locally on your computer. You maintain full control over your files.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading || checkingStoredDirectory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {checkingStoredDirectory ? "Checking for saved folder..." : "Loading datasets..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            DataGreg
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Create and manage datasets for fine-tuning AI models. Data is stored locally on your computer.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {/* Quick stats and controls */}
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-6 bg-white dark:bg-slate-800 rounded-2xl px-6 py-4 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {datasets.length} Dataset{datasets.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {datasets.reduce((acc, d) => acc + (d.items?.length || 0), 0)} Total Pairs
                </span>
              </div>
            </div>
            
            {/* Reset folder button */}
            <button
              onClick={resetDirectory}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 flex items-center gap-2"
              title="Reset data folder"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14l-4-4m0 4l4-4" />
              </svg>
              Change Data Folder
            </button>
          </div>
        </header>

        {/* Actions */}
        <div className="flex justify-center mb-12">
          <button
            onClick={createNewDataset}
            disabled={creating}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            aria-label="Create a new dataset"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Dataset
              </>
            )}
          </button>
        </div>

        {/* Datasets Grid */}
        {datasets.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-700 p-12 max-w-2xl mx-auto">
              <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                No datasets yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                Get started by creating your first dataset. You can then add input/output pairs for fine-tuning your AI models.
              </p>
              <button
                onClick={createNewDataset}
                disabled={creating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Dataset
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onRename={renameDataset}
                onDelete={deleteDataset}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-16 py-8 border-t border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400">
            Built with Next.js • Export to JSONL for OpenAI, Gemini, and more
          </p>
        </footer>
      </div>
    </div>
  );
}