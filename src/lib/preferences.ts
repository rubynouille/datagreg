import { ExportFormat } from "./types";

export interface UserPreferences {
  defaultExportFormat: ExportFormat;
  showWelcomeGuide: boolean;
  rememberFolder: boolean;
  defaultPageSize: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultExportFormat: "openai_chat", // OpenAI as default
  showWelcomeGuide: true,
  rememberFolder: false,
  defaultPageSize: 20,
};

const PREFERENCES_KEY = "datagreg-preferences";

// Get preferences from localStorage with fallback to defaults
export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing keys in stored preferences
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load preferences:", error);
  }

  return DEFAULT_PREFERENCES;
}

// Save preferences to localStorage
export function setPreferences(preferences: Partial<UserPreferences>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn("Failed to save preferences:", error);
  }
}

// Individual preference helpers
export function getDefaultExportFormat(): ExportFormat {
  return getPreferences().defaultExportFormat;
}

export function setDefaultExportFormat(format: ExportFormat): void {
  setPreferences({ defaultExportFormat: format });
}

export function getShouldShowWelcomeGuide(): boolean {
  return getPreferences().showWelcomeGuide;
}

export function setShouldShowWelcomeGuide(show: boolean): void {
  setPreferences({ showWelcomeGuide: show });
}

export function getRememberFolder(): boolean {
  return getPreferences().rememberFolder;
}

export function setRememberFolder(remember: boolean): void {
  setPreferences({ rememberFolder: remember });
}

export function getDefaultPageSize(): number {
  return getPreferences().defaultPageSize;
}

export function setDefaultPageSize(pageSize: number): void {
  setPreferences({ defaultPageSize: pageSize });
}
