import { DatabaseFile, Dataset, DatasetPair, ExportFormat } from "./types";

// File System Access API types
interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
  name: string;
}

interface FileSystemDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
  keys(): AsyncIterableIterator<string>;
  removeEntry?(name: string): Promise<void>;
  requestPermission?(options?: { mode?: string }): Promise<string>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}

  // Extend Window to include File System Access API
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    showSaveFilePicker?: (options?: Record<string, unknown>) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: Record<string, unknown>) => Promise<FileSystemFileHandle[]>;
  }
}

class ClientDatabase {
  private db: DatabaseFile | null = null;
  private directoryHandle: FileSystemDirectoryHandle | null = null;
  private lastModified = 0;
  private hasChanges = false;
  private readonly STORAGE_KEY = "datagreg-directory-handle";

  // Check if File System Access API is supported
  isSupported(): boolean {
    return typeof window !== "undefined" && 
           "showDirectoryPicker" in window &&
           "showSaveFilePicker" in window &&
           "showOpenFilePicker" in window;
  }

  // Get user-friendly browser compatibility message
  getBrowserCompatibilityMessage(): string {
    if (typeof window === "undefined") {
      return "This application requires a browser environment.";
    }

    // First check if the API is actually supported, regardless of user agent
    if (this.isSupported()) {
      return "Your browser supports File System Access API. You're good to go!";
    }

    const userAgent = navigator.userAgent.toLowerCase();
    
    // Provide more accurate compatibility information based on actual browser support
    if (userAgent.includes("firefox")) {
      return "Firefox doesn't yet support File System Access API. Please switch to Chrome, Edge, or another Chromium-based browser.";
    } else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
      return "Safari doesn't support File System Access API. Please switch to Chrome, Edge, or another Chromium-based browser.";
    } else if (userAgent.includes("chrome") || userAgent.includes("chromium") || userAgent.includes("edge")) {
      // Browser should support it but API check failed - might be disabled or older version
      return "Your browser should support File System Access API, but it appears to be unavailable. Please ensure you're using a recent version and the feature isn't disabled.";
    } else {
      return "Your browser doesn't support File System Access API. Please use Chrome, Edge, or another Chromium-based browser for the best experience.";
    }
  }

  // Initialize directory picker
  async initializeDirectory(rememberFolder: boolean = false): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("File System Access API is not supported in this browser");
    }

    try {
      this.directoryHandle = await window.showDirectoryPicker!();
      await this.loadDatabase();
      
      // Store the directory handle if user wants to remember it
      if (rememberFolder && this.directoryHandle) {
        await this.storeDirectoryHandle(this.directoryHandle);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Directory selection was cancelled");
      }
      throw error;
    }
  }

  // Try to restore from stored directory
  async restoreStoredDirectory(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const storedHandle = await this.retrieveDirectoryHandle();
      if (storedHandle) {
        this.directoryHandle = storedHandle;
        await this.loadDatabase();
        return true;
      }
    } catch (error) {
      console.warn("Failed to restore stored directory:", error);
      // Clear invalid stored handle
      await this.clearStoredDirectoryHandle();
    }
    return false;
  }

  // Reset/clear directory and stored data
  async resetDirectory(): Promise<void> {
    this.reset();
    await this.clearStoredDirectoryHandle();
  }

  // Load the database from the selected directory
  async loadDatabase(): Promise<DatabaseFile> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected. Call initializeDirectory() first.");
    }

    try {
      const dbFileHandle = await this.directoryHandle.getFileHandle("DataGreg.json", { create: true });
      const file = await dbFileHandle.getFile();
      
      if (file.size === 0) {
        // Create new empty database
        this.db = this.createEmptyDatabase();
        await this.saveDatabase();
      } else {
        const content = await file.text();
        const parsed: DatabaseFile = JSON.parse(content);
        this.db = this.migrateDatabase(parsed);
        
        // Save migrated database if needed
        if (parsed.version !== this.db.version) {
          await this.saveDatabase();
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Corrupted database file, create new one
        this.db = this.createEmptyDatabase();
        await this.saveDatabase();
      } else {
        throw error;
      }
    }

    return this.db;
  }

  // Create empty database structure
  private createEmptyDatabase(): DatabaseFile {
    const now = new Date().toISOString();
    return {
      version: 2,
      datasets: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  // Migrate old database formats
  private migrateDatabase(db: DatabaseFile): DatabaseFile {
    // Migrate legacy v1 (single dataset) to v2 (multi-dataset)
    if (!db.version || db.version < 2) {
      const now = new Date().toISOString();
      const dataset: Dataset = {
        id: crypto.randomUUID(),
        name: "Default",
        items: Array.isArray(db.items) ? db.items : [],
        createdAt: db.createdAt || now,
        updatedAt: db.updatedAt || now,
      };
      return {
        version: 2,
        datasets: [dataset],
        createdAt: db.createdAt || now,
        updatedAt: now,
      };
    }

    // Ensure datasets array exists
    if (!Array.isArray(db.datasets)) {
      db.datasets = [];
    }

    return db;
  }

  // Save database to file
  async saveDatabase(): Promise<void> {
    if (!this.directoryHandle || !this.db) {
      throw new Error("No directory or database available");
    }

    this.db.updatedAt = new Date().toISOString();
    this.markChanged();

    const dbFileHandle = await this.directoryHandle.getFileHandle("DataGreg.json", { create: true });
    const writable = await dbFileHandle.createWritable();
    await writable.write(JSON.stringify(this.db, null, 2));
    await writable.close();
  }

  // Mark database as changed for auto-backup
  private markChanged(): void {
    this.lastModified = Date.now();
    this.hasChanges = true;
  }

  // Get current database
  getDatabase(): DatabaseFile {
    if (!this.db) {
      throw new Error("Database not loaded. Call loadDatabase() first.");
    }
    return this.db;
  }

  // Check if database is loaded without throwing error
  isDatabaseLoaded(): boolean {
    return this.db !== null;
  }

  // Check if directory is selected
  isDirectorySelected(): boolean {
    return this.directoryHandle !== null;
  }

  // Store directory handle in IndexedDB for persistence
  private async storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    if (!this.isSupported()) return;
    
    try {
      // Check if we have permission (if the method exists)
      if ('requestPermission' in handle) {
        const permission = await handle.requestPermission!({ mode: 'readwrite' });
        if (permission !== 'granted') {
          throw new Error('Permission not granted');
        }
      }

      // Store in IndexedDB
      const request = indexedDB.open('DataGregDB', 1);
      
      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['handles'], 'readwrite');
          const store = transaction.objectStore('handles');
          store.put(handle, this.STORAGE_KEY);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles');
          }
        };
      });
    } catch (error) {
      console.warn('Failed to store directory handle:', error);
    }
  }

  // Retrieve directory handle from IndexedDB
  private async retrieveDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (!this.isSupported()) return null;
    
    try {
      const request = indexedDB.open('DataGregDB', 1);
      
      return new Promise((resolve) => {
        request.onerror = () => resolve(null);
        request.onsuccess = async () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains('handles')) {
            resolve(null);
            return;
          }
          
          const transaction = db.transaction(['handles'], 'readonly');
          const store = transaction.objectStore('handles');
          const getRequest = store.get(this.STORAGE_KEY);
          
          getRequest.onsuccess = async () => {
            const handle = getRequest.result as FileSystemDirectoryHandle;
            if (!handle) {
              resolve(null);
              return;
            }
            
            try {
              // Check if we still have permission (if the method exists)
              if ('requestPermission' in handle) {
                const permission = await handle.requestPermission!({ mode: 'readwrite' });
                if (permission === 'granted') {
                  resolve(handle);
                } else {
                  // Permission was revoked, remove the stored handle
                  await this.clearStoredDirectoryHandle();
                  resolve(null);
                }
              } else {
                // No permission check available, assume it's valid
                resolve(handle);
              }
            } catch {
              // Handle is no longer valid, remove it
              await this.clearStoredDirectoryHandle();
              resolve(null);
            }
          };
          getRequest.onerror = () => resolve(null);
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles');
          }
        };
      });
    } catch (error) {
      console.warn('Failed to retrieve directory handle:', error);
      return null;
    }
  }

  // Clear stored directory handle
  private async clearStoredDirectoryHandle(): Promise<void> {
    if (!this.isSupported()) return;
    
    try {
      const request = indexedDB.open('DataGregDB', 1);
      
      return new Promise((resolve) => {
        request.onerror = () => resolve();
        request.onsuccess = () => {
          const db = request.result;
          
          if (!db.objectStoreNames.contains('handles')) {
            resolve();
            return;
          }
          
          const transaction = db.transaction(['handles'], 'readwrite');
          const store = transaction.objectStore('handles');
          store.delete(this.STORAGE_KEY);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => resolve();
        };
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('handles')) {
            db.createObjectStore('handles');
          }
        };
      });
    } catch (error) {
      console.warn('Failed to clear directory handle:', error);
    }
  }

  // Check if directory handle is stored
  async hasStoredDirectory(): Promise<boolean> {
    const handle = await this.retrieveDirectoryHandle();
    return handle !== null;
  }

  // Dataset operations
  async listDatasets(): Promise<Dataset[]> {
    const db = this.getDatabase();
    return db.datasets || [];
  }

  async createDataset(name: string): Promise<Dataset> {
    const db = this.getDatabase();
    const now = new Date().toISOString();
    const dataset: Dataset = {
      id: crypto.randomUUID(),
      name,
      items: [],
      createdAt: now,
      updatedAt: now,
    };

    if (!db.datasets) {
      db.datasets = [];
    }
    db.datasets.push(dataset);
    await this.saveDatabase();
    return dataset;
  }

  async updateDataset(id: string, updates: Partial<Dataset>): Promise<Dataset> {
    const db = this.getDatabase();
    const dataset = db.datasets?.find(d => d.id === id);
    if (!dataset) {
      throw new Error("Dataset not found");
    }

    Object.assign(dataset, updates, { updatedAt: new Date().toISOString() });
    await this.saveDatabase();
    return dataset;
  }

  async deleteDataset(id: string): Promise<void> {
    const db = this.getDatabase();
    if (!db.datasets) return;

    const index = db.datasets.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error("Dataset not found");
    }

    db.datasets.splice(index, 1);
    await this.saveDatabase();
  }

  // Pair operations
  async listPairs(datasetId?: string): Promise<DatasetPair[]> {
    const db = this.getDatabase();
    if (!datasetId) {
      // Return all pairs from all datasets
      return db.datasets?.flatMap(d => d.items) || [];
    }

    const dataset = db.datasets?.find(d => d.id === datasetId);
    return dataset?.items || [];
  }

  async addPair(input: string, output: string, metadata?: Record<string, unknown>, datasetId?: string): Promise<DatasetPair> {
    const db = this.getDatabase();
    
    // Find target dataset or use first one
    const targetDataset = datasetId ? db.datasets?.find(d => d.id === datasetId) : db.datasets?.[0];
    if (!targetDataset) {
      throw new Error("No dataset available");
    }

    const now = new Date().toISOString();
    const pair: DatasetPair = {
      id: crypto.randomUUID(),
      input,
      output,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    targetDataset.items.push(pair);
    targetDataset.updatedAt = now;
    await this.saveDatabase();
    return pair;
  }

  async updatePair(id: string, updates: Partial<DatasetPair>, datasetId?: string): Promise<DatasetPair> {
    const db = this.getDatabase();
    
    let targetPair: DatasetPair | undefined;
    let targetDataset: Dataset | undefined;

    if (datasetId) {
      targetDataset = db.datasets?.find(d => d.id === datasetId);
      targetPair = targetDataset?.items.find(p => p.id === id);
    } else {
      // Search all datasets
      for (const dataset of db.datasets || []) {
        targetPair = dataset.items.find(p => p.id === id);
        if (targetPair) {
          targetDataset = dataset;
          break;
        }
      }
    }

    if (!targetPair || !targetDataset) {
      throw new Error("Pair not found");
    }

    Object.assign(targetPair, updates, { updatedAt: new Date().toISOString() });
    targetDataset.updatedAt = new Date().toISOString();
    await this.saveDatabase();
    return targetPair;
  }

  async deletePair(id: string, datasetId?: string): Promise<void> {
    const db = this.getDatabase();
    
    let targetDataset: Dataset | undefined;
    let pairIndex = -1;

    if (datasetId) {
      targetDataset = db.datasets?.find(d => d.id === datasetId);
      pairIndex = (targetDataset?.items.findIndex(p => p.id === id) ?? -1);
    } else {
      // Search all datasets
      for (const dataset of db.datasets || []) {
        pairIndex = dataset.items.findIndex(p => p.id === id);
        if (pairIndex !== -1) {
          targetDataset = dataset;
          break;
        }
      }
    }

    if (!targetDataset || pairIndex === -1) {
      throw new Error("Pair not found");
    }

    targetDataset.items.splice(pairIndex, 1);
    targetDataset.updatedAt = new Date().toISOString();
    await this.saveDatabase();
  }

  // Import functionality
  async importJSONL(datasetId: string, format: "gemini" | "openai_chat", jsonl: string): Promise<{ imported: number }> {
    const db = this.getDatabase();
    const dataset = db.datasets?.find(d => d.id === datasetId);
    if (!dataset) {
      throw new Error("Dataset not found");
    }

    const lines = jsonl
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    let imported = 0;
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        let input = "";
        let output = "";
        
        if (format === "gemini") {
          const contents = obj.contents || [];
          const user = contents.find((c: { role: string; parts?: { text: string }[] }) => c.role === "user");
          const model = contents.find((c: { role: string; parts?: { text: string }[] }) => c.role === "model");
          input = user?.parts?.[0]?.text ?? "";
          output = model?.parts?.[0]?.text ?? "";
        } else if (format === "openai_chat") {
          const messages = obj.messages || [];
          const user = messages.find((m: { role: string; content: string }) => m.role === "user");
          const assistant = messages.find((m: { role: string; content: string }) => m.role === "assistant");
          input = user?.content ?? "";
          output = assistant?.content ?? "";
        }
        
        if (typeof input === "string" && typeof output === "string" && input && output) {
          const now = new Date().toISOString();
          const pair: DatasetPair = {
            id: crypto.randomUUID(),
            input,
            output,
            createdAt: now,
            updatedAt: now,
          };
          dataset.items.push(pair);
          imported += 1;
        }
      } catch {
        // Skip invalid lines
      }
    }
    
    if (imported > 0) {
      dataset.updatedAt = new Date().toISOString();
      await this.saveDatabase();
    }
    
    return { imported };
  }

  // Export functionality
  async exportData(format: ExportFormat, datasetId?: string): Promise<string> {
    const pairs = await this.listPairs(datasetId);
    
    const lines = pairs.map(pair => {
      if (format === "gemini") {
        return JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: pair.input }] },
            { role: "model", parts: [{ text: pair.output }] }
          ]
        });
      } else if (format === "openai_chat") {
        return JSON.stringify({
          messages: [
            { role: "user", content: pair.input },
            { role: "assistant", content: pair.output }
          ]
        });
      }
      return "";
    }).filter(line => line);
    
    return lines.join("\n");
  }

  // Backup functionality
  async createBackup(): Promise<string> {
    if (!this.directoryHandle || !this.db) {
      throw new Error("No directory or database available");
    }

    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").slice(0, -5);
    const filename = `backup-${timestamp}.json`;
    
    try {
      const backupHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
      const writable = await backupHandle.createWritable();
      await writable.write(JSON.stringify(this.db, null, 2));
      await writable.close();
      return filename;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }

  async listBackups(): Promise<Array<{ filename: string; timestamp: string; itemCount: number; size: number }>> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected");
    }

    const backups = [];
    
    // Use values() iterator which is more reliably supported
    for await (const handle of this.directoryHandle.values()) {
      // Check if it's a file handle by trying to access file-specific properties
      if ('getFile' in handle) {
        const fileHandle = handle as FileSystemFileHandle;
        const name = fileHandle.name;
        
        if ((name.startsWith("backup-") || name.startsWith("db-")) && name.endsWith(".json")) {
          try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            const data = JSON.parse(content);
            const itemCount = data.datasets?.reduce((acc: number, d: Dataset) => acc + (d.items?.length || 0), 0) || 0;
            
            // Extract timestamp based on filename prefix
            let timestamp: string;
            if (name.startsWith("backup-")) {
              timestamp = name.slice(7, -5); // Remove "backup-" and ".json"
            } else {
              timestamp = name.slice(3, -5); // Remove "db-" and ".json"
            }
            
            // Validate timestamp format and fix common issues
            timestamp = this.validateAndFixTimestamp(timestamp);
            
            backups.push({
              filename: name,
              timestamp,
              itemCount,
              size: file.size,
            });
          } catch {
            // Skip invalid backup files
          }
        }
      }
    }
    
    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async restoreBackup(filename: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected");
    }

    try {
      const backupHandle = await this.directoryHandle.getFileHandle(filename);
      const file = await backupHandle.getFile();
      const content = await file.text();
      const backupData = JSON.parse(content);
      
      this.db = this.migrateDatabase(backupData);
      await this.saveDatabase();
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error}`);
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected");
    }

    try {
      // File System Access API uses removeEntry method on the directory handle
      const directoryHandleWithRemove = this.directoryHandle as FileSystemDirectoryHandle & { removeEntry: (name: string) => Promise<void> };
      await directoryHandleWithRemove.removeEntry(filename);
    } catch {
      // If removeEntry is not available, we can't delete the file
      // This is a limitation of the File System Access API
      console.warn("Cannot delete backup files - removeEntry not supported in this browser version");
      throw new Error("Backup deletion is not supported in this browser version");
    }
  }

  // Auto-backup check
  async checkAutoBackup(intervalMinutes: number = 60): Promise<{ backupCreated: boolean; filename?: string }> {
    const now = Date.now();
    const intervalMs = intervalMinutes * 60 * 1000;
    
    if (this.hasChanges && (now - this.lastModified) > intervalMs) {
      try {
        const filename = await this.createBackup();
        this.hasChanges = false;
        return { backupCreated: true, filename };
      } catch (error) {
        console.error("Auto-backup failed:", error);
        return { backupCreated: false };
      }
    }
    
    return { backupCreated: false };
  }

  // Download methods for export and backup files
  async downloadExport(format: ExportFormat, datasetId?: string): Promise<void> {
    const content = await this.exportData(format, datasetId);
    const filename = `export-${format}-${new Date().toISOString().slice(0, 10)}.jsonl`;
    
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async downloadBackup(filename: string): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected");
    }

    try {
      const backupHandle = await this.directoryHandle.getFileHandle(filename);
      const file = await backupHandle.getFile();
      const url = URL.createObjectURL(file);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download backup: ${error}`);
    }
  }

  // Validate and fix timestamp format
  private validateAndFixTimestamp(timestamp: string): string {
    // Expected format: YYYYMMDD-HHMMSS
    const timestampRegex = /^(\d{8})-(\d{6})$/;
    const match = timestamp.match(timestampRegex);
    
    if (match) {
      return timestamp; // Already valid
    }
    
    // Try to fix common issues
    if (timestamp.length >= 8) {
      const datePart = timestamp.slice(0, 8);
      const timePart = timestamp.slice(9) || "000000";
      
      // Pad time part to 6 digits if shorter
      const paddedTimePart = timePart.padEnd(6, "0");
      
      return `${datePart}-${paddedTimePart}`;
    }
    
    // If we can't fix it, return current timestamp as fallback
    return new Date().toISOString().replace(/[-:.]/g, "").replace("T", "-").slice(0, -5);
  }

  // Clean up malformed backup files (optional utility method)
  async cleanupMalformedBackups(): Promise<{ cleaned: string[], errors: string[] }> {
    if (!this.directoryHandle) {
      throw new Error("No directory selected");
    }

    const cleaned: string[] = [];
    const errors: string[] = [];
    
    for await (const handle of this.directoryHandle.values()) {
      if ('getFile' in handle) {
        const fileHandle = handle as FileSystemFileHandle;
        const name = fileHandle.name;
        
        if ((name.startsWith("backup-") || name.startsWith("db-")) && name.endsWith(".json")) {
          try {
            // Check if timestamp is malformed
            let timestamp: string;
            if (name.startsWith("backup-")) {
              timestamp = name.slice(7, -5);
            } else {
              timestamp = name.slice(3, -5);
            }
            
            const timestampRegex = /^(\d{8})-(\d{6})$/;
            if (!timestampRegex.test(timestamp)) {
              // Try to delete malformed backup file if removeEntry is available
              const directoryHandleWithRemove = this.directoryHandle as FileSystemDirectoryHandle & { removeEntry?: (name: string) => Promise<void> };
              if (directoryHandleWithRemove.removeEntry) {
                await directoryHandleWithRemove.removeEntry(name);
                cleaned.push(name);
              } else {
                errors.push(`Cannot delete ${name} - removeEntry not supported`);
              }
            }
          } catch (error) {
            errors.push(`Error processing ${name}: ${error}`);
          }
        }
      }
    }
    
    return { cleaned, errors };
  }

  // Reset/clear directory
  reset(): void {
    this.db = null;
    this.directoryHandle = null;
    this.lastModified = 0;
    this.hasChanges = false;
  }
}

// Singleton instance
export const clientDB = new ClientDatabase();
