export interface DatasetPair {
  id: string;
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Dataset {
  id: string;
  name: string;
  items: DatasetPair[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// v2 database format with multiple datasets
export interface DatabaseFile {
  version: number; // 1 = legacy single dataset, 2 = multi-dataset
  // v1 had: items: DatasetPair[]
  // v2 uses: datasets: Dataset[]
  items?: DatasetPair[]; // legacy, optional for migration
  datasets?: Dataset[]; // v2
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export type ExportFormat = "gemini" | "openai_chat";


