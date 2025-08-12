"use client";

import { useEffect, useState, useCallback } from "react";
import { Dataset } from "@/lib/types";
import { DatasetCard } from "@/components/DatasetCard";
import { clientDB } from "@/lib/clientDb";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getRememberFolder, setRememberFolder } from "@/lib/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Plus, Database, Activity, RefreshCw, HelpCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export default function Home() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [directorySelected, setDirectorySelected] = useState<boolean>(false);
  const [initializingDirectory, setInitializingDirectory] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [rememberFolder, setRememberFolderState] = useState<boolean>(false);
  const [checkingStoredDirectory, setCheckingStoredDirectory] = useState<boolean>(false);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  
  // Dataset creation/rename dialogs
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [showRenameDialog, setShowRenameDialog] = useState<boolean>(false);
  const [datasetToRename, setDatasetToRename] = useState<Dataset | null>(null);
  const [newDatasetName, setNewDatasetName] = useState<string>("");
  const [renameDatasetName, setRenameDatasetName] = useState<string>("");
  




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
      // Load user preferences
      const shouldRemember = getRememberFolder();
      setRememberFolderState(shouldRemember);

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
      setRememberFolderState(false);
      setRememberFolder(false);
    } catch (error) {
      console.error("Failed to reset directory:", error);
      setError(error instanceof Error ? error.message : "Failed to reset directory");
    }
  }

  function createNewDataset() {
    setNewDatasetName("");
    setShowCreateDialog(true);
  }

  async function handleCreateDataset() {
    if (!newDatasetName.trim()) return;
    
    setCreating(true);
    setError("");
    try {
      await clientDB.createDataset(newDatasetName.trim());
      await loadDatasets();
      setShowCreateDialog(false);
      setNewDatasetName("");
    } catch (error) {
      console.error("Failed to create dataset:", error);
      setError(error instanceof Error ? error.message : "Failed to create dataset");
    } finally {
      setCreating(false);
    }
  }

  function renameDataset(dataset: Dataset) {
    setDatasetToRename(dataset);
    setRenameDatasetName(dataset.name);
    setShowRenameDialog(true);
  }

  async function handleRenameDataset() {
    if (!datasetToRename || !renameDatasetName.trim()) return;
    
    setError("");
    try {
      await clientDB.updateDataset(datasetToRename.id, { name: renameDatasetName.trim() });
      await loadDatasets();
      setShowRenameDialog(false);
      setDatasetToRename(null);
      setRenameDatasetName("");
    } catch (error) {
      console.error("Failed to rename dataset:", error);
      setError(error instanceof Error ? error.message : "Failed to rename dataset");
    }
  }

  function deleteDataset(dataset: Dataset) {
    setDatasetToDelete(dataset);
  }

  async function confirmDeleteDataset() {
    if (!datasetToDelete) return;
    
    setError("");
    try {
      await clientDB.deleteDataset(datasetToDelete.id);
      await loadDatasets();
      setDatasetToDelete(null);
    } catch (error) {
      console.error("Failed to delete dataset:", error);
      setError(error instanceof Error ? error.message : "Failed to delete dataset");
    }
  }

  // Show error if File System Access API is not supported
  if (error && error.includes("not supported")) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show interactive welcome guide</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
          <Card className="max-w-2xl w-full mx-4 border-destructive/50">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-destructive/10">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl sm:text-2xl text-destructive mb-3">Browser Not Supported</CardTitle>
              <CardDescription className="text-destructive/80 text-sm sm:text-base px-2">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <p className="text-destructive/70 text-sm sm:text-base px-2">
                This application requires the File System Access API to store data locally on your computer. 
                Please switch to a compatible browser to continue.
              </p>
            </CardContent>
          </Card>
        </div>
        

      </div>
    );
  }

  // Show directory selection if not yet selected
  if (!directorySelected && !loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/docs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View documentation and guides</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
        <Card className="max-w-2xl w-full mx-4">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white mb-6">
              <Image src="/logo.png" alt="DataGreg logo" width={64} height={64} />
            </div>
            <div className="space-y-3">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                DataGreg
              </CardTitle>
              <CardDescription className="text-lg sm:text-xl font-semibold px-2">
                Edit your AI/LLMs datasets in your browser, no need to download anything.
              </CardDescription>
              <p className="text-base sm:text-lg text-muted-foreground mt-4 px-2">
                Select a folder on your computer where your datasets will be stored.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-6">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
            
            {/* Remember folder checkbox */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="rememberFolder"
                    checked={rememberFolder}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRememberFolderState(checked);
                      setRememberFolder(checked);
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary mt-0.5"
                  />
                  <label htmlFor="rememberFolder" className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Remember this folder (saves folder permission for next time)
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save folder permissions so you don&apos;t need to select it every time</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="space-y-4">
                              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={selectDirectory}
                    disabled={initializingDirectory}
                    size="lg"
                    className="w-full"
    
                  >
                    {initializingDirectory ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        <span className="hidden sm:inline">Initializing...</span>
                        <span className="sm:hidden">Initializing...</span>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                        <span className="hidden sm:inline">Select Data Folder</span>
                        <span className="sm:hidden">Select Folder</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose a folder where your datasets will be stored locally</p>
                </TooltipContent>
              </Tooltip>
              <p className="text-sm text-muted-foreground text-center px-2">
                All your data will be stored locally on your computer. You maintain full control over your files.
              </p>
            </div>
          </CardContent>
        </Card>
        

      </div>
    );
  }

  if (loading || checkingStoredDirectory) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 sm:h-16 sm:w-16 text-primary animate-spin mb-6" />
            <p className="text-base sm:text-lg text-muted-foreground text-center px-4">
              {checkingStoredDirectory ? "Checking for saved folder..." : "Loading datasets..."}
            </p>
          </CardContent>
        </Card>
        

      </div>
    );
  }

      return (
      <div className="min-h-screen relative">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/docs">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>View documentation and guides</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggle />
        </div>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="text-center my-8 sm:my-12">
          
        
          <h1 className="text-3xl sm:text-4xl lg:text-5xl text-foreground font-bold mb-4 flex items-center justify-center gap-4">
            <Image src="/logo.png" alt="DataGreg logo" width={64} height={64} />
            DataGreg
            </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
            Create and manage datasets for fine-tuning AI models. Data is stored locally on your computer.
          </p>
          
          {error && (
            <div className="max-w-2xl mx-auto mb-6 sm:mb-8 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          
          {/* Quick stats and controls */}
          <div className="flex flex-col items-center gap-4">
            <Card className="w-full max-w-fit">
              <CardContent className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 px-4 sm:px-6">
                <Badge variant="outline" className="gap-1 whitespace-nowrap">
                  <FolderOpen className="h-3 w-3" />
                  {datasets.length} Dataset{datasets.length === 1 ? '' : 's'}
                </Badge>
                <Separator orientation="vertical" className="hidden sm:block h-6" />
                <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                  <Database className="h-3 w-3" />
                  {datasets.reduce((acc, d) => acc + (d.items?.length || 0), 0)} Total Pairs
                </Badge>
              </CardContent>
            </Card>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetDirectory}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Change Data Folder</span>
                    <span className="sm:hidden">Change Folder</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select a different folder for your data storage</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* Actions */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={createNewDataset}
                disabled={creating}
                size="lg"
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto"

              >
                {creating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    <span className="hidden sm:inline">Create New Dataset</span>
                    <span className="sm:hidden">Create Dataset</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new dataset to organize your training pairs</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Datasets Grid */}
        {datasets.length === 0 ? (
          <div className="flex justify-center py-8 sm:py-16">
            <Card className="max-w-2xl w-full mx-4">
              <CardContent className="flex flex-col items-center text-center py-12 sm:py-16 px-6">
                <Database className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground mb-6 sm:mb-8" />
                <CardTitle className="text-xl sm:text-2xl mb-4">No datasets yet</CardTitle>
                <CardDescription className="text-base sm:text-lg mb-6 sm:mb-8 max-w-md">
                  Get started by creating your first dataset. You can then add input/output pairs for fine-tuning your AI models.
                </CardDescription>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={createNewDataset}
                      disabled={creating}
                      size="lg"
                      className="w-full sm:w-auto"
      
                    >
                      {creating ? (
                        <>
                          <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                          <span className="hidden sm:inline">Creating...</span>
                          <span className="sm:hidden">Creating...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          <span className="hidden sm:inline">Create Your First Dataset</span>
                          <span className="sm:hidden">Create Dataset</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create your first dataset to start organizing training data</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
      </div>

      {/* Create Dataset Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dataset</DialogTitle>
            <DialogDescription>
              Give your dataset a meaningful name that describes its purpose, like &quot;Customer Support&quot; or &quot;Code Generation&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataset-name" className="text-right">
                Name
              </Label>
              <Input
                id="dataset-name"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
                className="col-span-3"
                placeholder="Enter dataset name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDatasetName.trim()) {
                    handleCreateDataset();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDataset} 
              disabled={!newDatasetName.trim() || creating}
            >
              {creating ? "Creating..." : "Create Dataset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dataset Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Dataset</DialogTitle>
            <DialogDescription>
              Enter a new name for &quot;{datasetToRename?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-dataset-name" className="text-right">
                Name
              </Label>
              <Input
                id="rename-dataset-name"
                value={renameDatasetName}
                onChange={(e) => setRenameDatasetName(e.target.value)}
                className="col-span-3"
                placeholder="Enter dataset name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renameDatasetName.trim()) {
                    handleRenameDataset();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameDataset} 
              disabled={!renameDatasetName.trim()}
            >
              Rename Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dataset Confirmation Dialog */}
      <AlertDialog open={!!datasetToDelete} onOpenChange={() => setDatasetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete dataset &quot;{datasetToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDatasetToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDataset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}