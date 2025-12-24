import { getSettings, saveSettings, addBackupToHistory } from "@/lib/storage";
import {
  getAllBookmarks,
  createBackupData,
  exportAsJSON,
  exportAsHTML,
  generateFilename,
  countBookmarks,
} from "@/lib/bookmarks";
import { scheduleBackup, calculateNextBackupTime } from "@/lib/scheduler";
import {
  getDirectoryHandle,
  writeFileToDirectory,
  verifyDirectoryPermission,
} from "@/lib/filesystem";
import { BackupHistoryItem } from "@/types";

const ALARM_NAME = "bookmark-backup-alarm";

// Convert string to base64 for data URL (used by Chrome which runs in service workers)
function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Download function
async function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
  folder: string,
  saveAs: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use data URL (Blob URLs don't work in service workers)
    const base64Content = stringToBase64(content);
    const url = `data:${mimeType};base64,${base64Content}`;

    chrome.downloads.download(
      {
        url,
        filename: `${folder}/${filename}`,
        saveAs,
        conflictAction: "uniquify",
      },
      () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      }
    );
  });
}

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Bookmark Backup Pro installed");
  const settings = await getSettings();
  const nextBackup = await scheduleBackup(settings);

  if (nextBackup) {
    await saveSettings({ ...settings, nextBackup });
  }
});

// Handle alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await performBackup();
  }
});

// Listen for messages from popup/options
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "performBackup") {
    performBackup().then((result) => {
      sendResponse(result);
    });
    return true; // Keep the message channel open for async response
  }

  if (message.action === "updateSchedule") {
    getSettings().then(async (settings) => {
      const nextBackup = await scheduleBackup(settings);
      if (nextBackup) {
        await saveSettings({ ...settings, nextBackup });
      }
      sendResponse({ success: true, nextBackup });
    });
    return true;
  }

  if (message.action === "getStats") {
    getBookmarkStats().then((stats) => {
      sendResponse(stats);
    });
    return true;
  }

  // Open the downloads folder
  if (message.action === "openDownloadsFolder") {
    chrome.downloads.showDefaultFolder();
    sendResponse({ success: true });
    return true;
  }

  // Export a stored backup to file (manual download from extension storage)
  if (message.action === "exportBackup") {
    const { filename, content, mimeType } = message;

    getSettings().then(async (settings) => {
      try {
        const folder = settings.downloadFolder?.trim() || "BookmarkBackups";
        await downloadFile(content, filename, mimeType, folder, true);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: String(error) });
      }
    });
    return true;
  }
});

async function performBackup(): Promise<{
  success: boolean;
  error?: string;
  historyItem?: BackupHistoryItem;
}> {
  try {
    const settings = await getSettings();
    const bookmarks = await getAllBookmarks();
    const backupData = createBackupData(bookmarks);

    const filename = generateFilename(settings.format);
    let content: string;
    let mimeType: string;

    if (settings.format === "json") {
      content = exportAsJSON(backupData);
      mimeType = "application/json";
    } else {
      content = exportAsHTML(backupData);
      mimeType = "text/html";
    }

    const contentSize = new TextEncoder().encode(content).length;

    // Create history item
    const historyItem: BackupHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      filename,
      bookmarkCount: backupData.totalBookmarks,
      format: settings.format,
      size: contentSize,
    };

    // Storage mode: 'extension' stores in browser storage (NO PROMPTS!)
    // Storage mode: 'download' downloads to file system
    if (settings.storageMode === "extension") {
      // Store backup data directly in extension storage - completely silent!
      historyItem.data = content;
    } else if (settings.autoDownload) {
      // Try custom directory first if enabled
      let savedToCustomDir = false;

      if (settings.useCustomDirectory) {
        try {
          const dirHandle = await getDirectoryHandle();
          if (dirHandle) {
            const hasPermission = await verifyDirectoryPermission(dirHandle);
            if (hasPermission) {
              await writeFileToDirectory(
                dirHandle,
                filename,
                content,
                mimeType
              );
              savedToCustomDir = true;
              console.log("Saved to custom directory:", filename);
            }
          }
        } catch (error) {
          console.warn(
            "Failed to save to custom directory, falling back to Downloads:",
            error
          );
        }
      }

      // Fallback to chrome.downloads if custom directory not available
      if (!savedToCustomDir) {
        const folder = settings.downloadFolder?.trim() || "BookmarkBackups";
        await downloadFile(content, filename, mimeType, folder, false);
      }
    }

    await addBackupToHistory(historyItem);

    // Update last backup time and schedule next
    const updatedSettings = {
      ...settings,
      lastBackup: Date.now(),
      nextBackup: calculateNextBackupTime(settings),
    };
    await saveSettings(updatedSettings);
    await scheduleBackup(updatedSettings);

    console.log("Backup completed successfully:", filename);

    return { success: true, historyItem };
  } catch (error) {
    console.error("Backup failed:", error);
    return { success: false, error: String(error) };
  }
}

async function getBookmarkStats() {
  const bookmarks = await getAllBookmarks();
  const totalBookmarks = countBookmarks(bookmarks);
  const settings = await getSettings();

  return {
    totalBookmarks,
    lastBackup: settings.lastBackup,
    nextBackup: settings.nextBackup,
  };
}

// Keep service worker alive in Manifest V3
chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  await scheduleBackup(settings);
});
