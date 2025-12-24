export interface BackupSettings {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  customIntervalDays?: number;
  backupTime: string; // HH:MM format
  backupDay?: number; // 0-6 for weekly, 1-31 for monthly
  format: "json" | "html";
  autoDownload: boolean;
  storageMode: "download" | "extension"; // 'extension' stores in browser storage (no prompts!)
  downloadFolder: string; // Folder path for downloads (relative to browser's download directory)
  useCustomDirectory: boolean; // Use File System Access API for custom folder
  customDirectoryName?: string; // Display name of the selected custom directory
  keepBackupCount: number;
  lastBackup?: number; // timestamp
  nextBackup?: number; // timestamp
}

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkNode[];
  parentId?: string;
}

export interface BackupData {
  version: string;
  exportDate: string;
  browserInfo: string;
  totalBookmarks: number;
  bookmarks: BookmarkNode[];
}

export interface BackupHistoryItem {
  id: string;
  timestamp: number;
  filename: string;
  bookmarkCount: number;
  format: "json" | "html";
  size: number;
  data?: string; // Stored backup content (when using extension storage mode)
}

export const DEFAULT_SETTINGS: BackupSettings = {
  enabled: true,
  frequency: "weekly",
  backupTime: "09:00",
  backupDay: 0, // Sunday
  format: "html",
  autoDownload: true,
  storageMode: "extension", // Default to extension storage (no download prompts!)
  downloadFolder: "BookmarkBackups", // Default folder for downloads
  useCustomDirectory: false, // Default to Downloads subfolder
  keepBackupCount: 5,
};
