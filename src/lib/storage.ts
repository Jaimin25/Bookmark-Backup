import { BackupSettings, BackupHistoryItem, DEFAULT_SETTINGS } from '@/types';

const SETTINGS_KEY = 'backupSettings';
const HISTORY_KEY = 'backupHistory';

export async function getSettings(): Promise<BackupSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      resolve(result[SETTINGS_KEY] || DEFAULT_SETTINGS);
    });
  });
}

export async function saveSettings(settings: BackupSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
      resolve();
    });
  });
}

export async function getBackupHistory(): Promise<BackupHistoryItem[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_KEY], (result) => {
      resolve(result[HISTORY_KEY] || []);
    });
  });
}

export async function addBackupToHistory(item: BackupHistoryItem): Promise<void> {
  const history = await getBackupHistory();
  const settings = await getSettings();
  
  history.unshift(item);
  
  // Keep only the specified number of backups
  const trimmedHistory = history.slice(0, settings.keepBackupCount);
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ [HISTORY_KEY]: trimmedHistory }, () => {
      resolve();
    });
  });
}

export async function clearBackupHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([HISTORY_KEY], () => {
      resolve();
    });
  });
}

export async function getBackupById(id: string): Promise<BackupHistoryItem | null> {
  const history = await getBackupHistory();
  return history.find(item => item.id === id) || null;
}

