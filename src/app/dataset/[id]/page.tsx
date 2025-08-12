"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import type { DatasetPair, ExportFormat, Dataset } from "@/lib/types";
import { getDefaultExportFormat, setDefaultExportFormat, getDefaultPageSize, setDefaultPageSize } from "@/lib/preferences";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PairForm } from "@/components/PairForm";
import { ImportSection } from "@/components/ImportSection";
import { PairItem } from "@/components/PairItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { clientDB } from "@/lib/clientDb";
import { FolderOpen } from "lucide-react";

type EditingState = {
  id: string;
  input: string;
  output: string;
} | null;

export default function DatasetEditPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;
  
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [items, setItems] = useState<DatasetPair[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [datasetLoading, setDatasetLoading] = useState<boolean>(true);

  const [format, setFormat] = useState<ExportFormat>("openai_chat");
  const [editing, setEditing] = useState<EditingState>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showBackups, setShowBackups] = useState<boolean>(false);
  const [backups, setBackups] = useState<Array<{ filename: string; timestamp: string; itemCount: number; size: number }>>([]);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [autoBackupStatus, setAutoBackupStatus] = useState<string>("Idle");
  
  // Dialog states
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);
  const [pairToDelete, setPairToDelete] = useState<string | null>(null);

  // Import
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const loadDataset = useCallback(async () => {
    try {
      const datasets = await clientDB.listDatasets();
      const foundDataset = datasets.find((d: Dataset) => d.id === datasetId);
      
      if (!foundDataset) {
        router.push("/");
        return;
      }
      
      setDataset(foundDataset);
    } catch (error) {
      console.error("Failed to load dataset:", error);
      // If clientDB is not initialized, redirect to home
      router.push("/");
    } finally {
      setDatasetLoading(false);
    }
  }, [datasetId, router]);

  const loadPairs = useCallback(async () => {
    setLoading(true);
    try {
      const pairs = await clientDB.listPairs(datasetId);
      setItems(pairs);
    } catch (error) {
      console.error("Failed to load pairs:", error);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  const loadBackups = useCallback(async () => {
    setBackupLoading(true);
    try {
      const backupList = await clientDB.listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error("Failed to load backups:", error);
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (datasetId) {
      loadDataset();
      loadPairs();
      loadBackups();
      // Load preferred export format
      const preferredFormat = getDefaultExportFormat();
      setFormat(preferredFormat);
      // Load preferred page size
      const preferredPageSize = getDefaultPageSize();
      setPageSize(preferredPageSize);
    }
  }, [datasetId, loadDataset, loadPairs, loadBackups]);



  // Auto-backup functionality
  useEffect(() => {
    const autoBackupInterval = setInterval(async () => {
      try {
        setAutoBackupStatus("Checking...");
        const result = await clientDB.checkAutoBackup(1); // Check every minute
        
        if (result.backupCreated) {
          setAutoBackupStatus("Backup created");
          if (showBackups) {
            loadBackups();
          }
        } else {
          setAutoBackupStatus("No changes");
        }
        
        setTimeout(() => setAutoBackupStatus("Idle"), 3000);
      } catch (error) {
        console.error("Auto-backup failed:", error);
        setAutoBackupStatus("Failed");
        setTimeout(() => setAutoBackupStatus("Idle"), 3000);
      }
    }, 60000);

    return () => clearInterval(autoBackupInterval);
  }, [showBackups, loadBackups]);

  async function createManualBackup() {
    setBackupLoading(true);
    try {
      await clientDB.createBackup();
      loadBackups();
    } catch (error) {
      console.error("Failed to create backup:", error);
    } finally {
      setBackupLoading(false);
    }
  }

  function deleteBackup(filename: string) {
    setBackupToDelete(filename);
  }

  async function confirmDeleteBackup() {
    if (!backupToDelete) return;
    
    try {
      await clientDB.deleteBackup(backupToDelete);
      loadBackups();
      setBackupToDelete(null);
    } catch (error) {
      console.error("Failed to delete backup:", error);
    }
  }

  function restoreBackup(filename: string) {
    setBackupToRestore(filename);
  }

  async function confirmRestoreBackup() {
    if (!backupToRestore) return;
    
    try {
      await clientDB.restoreBackup(backupToRestore);
      loadPairs();
      loadDataset(); // Reload dataset info too
      setShowBackups(false);
      setBackupToRestore(null);
    } catch (error) {
      console.error("Failed to restore backup:", error);
    }
  }

  useEffect(() => {
    if (showBackups) {
      loadBackups();
    }
  }, [showBackups, loadBackups]);



  function onDelete(id: string) {
    setPairToDelete(id);
  }

  async function confirmDeletePair() {
    if (!pairToDelete) return;
    
    setDeletingId(pairToDelete);
    try {
      await clientDB.deletePair(pairToDelete, datasetId);
      loadPairs();
      setPairToDelete(null);
    } catch (error) {
      console.error("Failed to delete pair:", error);
    } finally {
      setDeletingId(null);
    }
  }

  async function onEdit(item: DatasetPair) {
    setEditing({
      id: item.id,
      input: item.input,
      output: item.output,
    });
  }



  function onCancelEdit() {
    setEditing(null);
  }



  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.input.toLowerCase().includes(query) || 
      item.output.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Reset to page 1 when items or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredItems.length, searchQuery]);

  // Pagination calculations
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setDefaultPageSize(newPageSize); // Save preference
    setCurrentPage(1); // Reset to first page
  };

  const count = items.length;
  
  // Export handler for client-side export
  const handleExport = async () => {
    try {
      await clientDB.downloadExport(format, datasetId);
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  if (datasetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        {/* Header with navigation */}
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-lg p-2"
              aria-label="Back to datasets"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Datasets
            </Link>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <FolderOpen className="h-10 w-10 shrink-0 text-muted-foreground" /> 
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {dataset.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {count} pair{count === 1 ? "" : "s"} • Dataset ID: {dataset.id.slice(-8)}
              </p>
            </div>
          </div>
        </header>

        {/* Add New Pair Form */}
        <section className="mb-12">
          <PairForm 
            onSubmit={async (input, output) => {
              setLoading(true);
              try {
                await clientDB.addPair(input, output, undefined, datasetId);
                await loadPairs(); // Wait for pairs to reload
              } catch (error) {
                console.error("Failed to add pair:", error);
              } finally {
                setLoading(false);
              }
            }}
            loading={loading}
            pairCount={count}
          />
        </section>

        {/* Import Section */}
        <section className="mb-12">
          <ImportSection 
            onImport={async (format, jsonl) => {
              setImportLoading(true);
              setImportResult("");
              try {
                const result = await clientDB.importJSONL(datasetId, format, jsonl);
                setImportResult(`Imported ${result.imported} items`);
                loadPairs();

              } catch (error) {
                setImportResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
              } finally {
                setImportLoading(false);
              }
            }}
            loading={importLoading}
            result={importResult}
          />
        </section>

        {/* Dataset Management Section */}
        <section>
          <div className="soft-card rounded-2xl">
            <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Training Pairs
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                                     {/* Search */}
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <div className="relative">
                         <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                         </svg>
                         <input
                           type="text"
                           placeholder="Search pairs..."
                           className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           aria-label="Search training pairs"
                         />
                       </div>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>Search through your training pairs by input or output text</p>
                     </TooltipContent>
                   </Tooltip>
                                     {/* Export Controls */}
                   <div className="flex items-center gap-3">
                     <label htmlFor="export-format" className="sr-only">Export format</label>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <select
                           id="export-format"
                           className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm focus:ring-2 focus:ring-ring focus:border-transparent"
                           value={format}
                           onChange={(e) => {
                             const newFormat = e.target.value as ExportFormat;
                             setFormat(newFormat);
                             setDefaultExportFormat(newFormat); // Remember user's choice
                           }}
                         >
                           <option value="openai_chat">OpenAI Chat JSONL</option>
                           <option value="gemini">Gemini JSONL</option>
                         </select>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Choose export format. Your preference will be saved for next time.</p>
                       </TooltipContent>
                     </Tooltip>

                     <Tooltip>
                       <TooltipTrigger asChild>
                         <button
                           onClick={handleExport}
                           className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring"
 
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           Export
                         </button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Download your dataset as a JSONL file ready for AI training</p>
                       </TooltipContent>
                     </Tooltip>
                   </div>
                </div>
              </div>
            </div>

            {/* Backup Accordion */}
            <div className="border-t border-gray-200 dark:border-slate-700">
              <div 
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                onClick={() => setShowBackups(!showBackups)}
                role="button"
                tabIndex={0}
                aria-expanded={showBackups}
                aria-controls="backup-content"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowBackups(!showBackups);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V9a2 2 0 00-2-2H8z" />
                    </svg>
                    <h3 className="text-lg font-medium">Backup Management</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>Auto-backup:</span>
                      <div className={`w-2 h-2 rounded-full ${
                        autoBackupStatus === "Backup created" ? "bg-green-500" :
                        autoBackupStatus === "Checking..." ? "bg-yellow-500" :
                        autoBackupStatus === "Failed" ? "bg-red-500" :
                        "bg-gray-400"
                      }`} title={`Auto-backup: ${autoBackupStatus}`}></div>
                      <span>{autoBackupStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                                         <Tooltip>
                       <TooltipTrigger asChild>
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             createManualBackup();
                           }}
                           disabled={backupLoading}
                           className="px-3 py-1.5 brand-gradient text-white rounded-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                         >
                           {backupLoading ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                               Creating...
                             </>
                           ) : (
                             <>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                               </svg>
                               Create Backup
                             </>
                           )}
                         </button>
                       </TooltipTrigger>
                       <TooltipContent>
                         <p>Create a manual backup of your current dataset</p>
                       </TooltipContent>
                     </Tooltip>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showBackups ? "rotate-180" : "rotate-0"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {showBackups && (
                <div id="backup-content" className="px-4 sm:px-6 pb-4 sm:pb-6">
                  {backupLoading && backups.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-500 dark:text-gray-400">Loading backups...</p>
                    </div>
                  ) : backups.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2V9a2 2 0 00-2-2H8z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">No backups found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first backup or wait for automatic backups</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {backups.map((backup) => (
                        <div key={backup.filename} className="glass-panel rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{backup.filename}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {backup.itemCount} items • {(backup.size / 1024).toFixed(1)} KB
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                Created: {new Date(backup.timestamp.replace(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6')).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                                             <Tooltip>
                                 <TooltipTrigger asChild>
                                   <button
                                     onClick={() => restoreBackup(backup.filename)}
                                     className="px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50/60 dark:hover:bg-green-900/20 rounded transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                     </svg>
                                     Restore
                                   </button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Restore your dataset from this backup (will replace current data)</p>
                                 </TooltipContent>
                               </Tooltip>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <button
                                     onClick={() => deleteBackup(backup.filename)}
                                     className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 rounded transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                                   >
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                     </svg>
                                     Delete
                                   </button>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>Permanently delete this backup file</p>
                                 </TooltipContent>
                               </Tooltip>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  {items.length === 0 ? (
                    <>
                      <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">No training pairs yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Add your first input/output pair above to get started</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">No matches found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search query</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedItems.map((item) => (
                      <PairItem
                        key={item.id}
                        pair={item}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isEditing={editing?.id === item.id}
                        onSave={async (id, input, output) => {
                          setUpdatingId(id);
                          try {
                            await clientDB.updatePair(id, { input, output }, datasetId);
                            setEditing(null);
                            loadPairs();
                          } catch (error) {
                            console.error("Failed to update pair:", error);
                          } finally {
                            setUpdatingId(null);
                          }
                        }}
                        onCancelEdit={onCancelEdit}
                        isUpdating={updatingId === item.id}
                        isDeleting={deletingId === item.id}
                      />
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label htmlFor="page-size" className="text-sm text-gray-600 dark:text-gray-400">
                            Items per page:
                          </label>
                          <select
                            id="page-size"
                            value={pageSize}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                            className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1 text-sm bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm focus:ring-2 focus:ring-ring focus:border-transparent"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i;
                            } else {
                              pageNumber = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
                                  currentPage === pageNumber
                                    ? "bg-blue-600 text-white"
                                    : "border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/60"
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Delete Backup Confirmation Dialog */}
      <AlertDialog open={!!backupToDelete} onOpenChange={() => setBackupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete backup {backupToDelete}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBackup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Backup Confirmation Dialog */}
      <AlertDialog open={!!backupToRestore} onOpenChange={() => setBackupToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore from backup {backupToRestore}? This will replace your current data and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToRestore(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestoreBackup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Pair Confirmation Dialog */}
      <AlertDialog open={!!pairToDelete} onOpenChange={() => setPairToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Pair</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training pair? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPairToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePair} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
