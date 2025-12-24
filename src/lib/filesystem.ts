// File System Access API utilities for custom folder selection

const DB_NAME = "BookmarkBackupFS";
const STORE_NAME = "directoryHandles";
const HANDLE_KEY = "backupDirectory";

// Open IndexedDB for storing directory handles
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Store the directory handle in IndexedDB
export async function storeDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, HANDLE_KEY);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Retrieve the directory handle from IndexedDB
export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

// Clear the stored directory handle
export async function clearDirectoryHandle(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore errors when clearing
  }
}

// Check if we have permission to access the directory (without requesting)
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    // Check if we have read/write permission
    const permission = await handle.queryPermission({ mode: "readwrite" });
    return permission === "granted";
  } catch {
    return false;
  }
}

// Request permission for directory (only works with user gesture in document context)
export async function requestDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") {
      return true;
    }
    // Try to request permission (requires user gesture)
    const requestResult = await handle.requestPermission({ mode: "readwrite" });
    return requestResult === "granted";
  } catch {
    return false;
  }
}

// Open the directory picker and store the selected folder
export async function pickDirectory(): Promise<{
  handle: FileSystemDirectoryHandle;
  name: string;
} | null> {
  try {
    // Check if File System Access API is supported
    if (!("showDirectoryPicker" in window)) {
      throw new Error("File System Access API is not supported");
    }

    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "downloads",
    });

    // Store the handle for later use
    await storeDirectoryHandle(handle);

    return { handle, name: handle.name };
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name === "AbortError") {
      return null; // User cancelled
    }
    throw error;
  }
}

// Write a file to the selected directory
export async function writeFileToDirectory(
  handle: FileSystemDirectoryHandle,
  filename: string,
  content: string,
  mimeType: string
): Promise<void> {
  // Verify we have permission
  const hasPermission = await verifyDirectoryPermission(handle);
  if (!hasPermission) {
    throw new Error("Permission denied to write to directory");
  }

  // Create the file
  const fileHandle = await handle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();

  // Write the content
  const blob = new Blob([content], { type: mimeType });
  await writable.write(blob);
  await writable.close();
}

// Get stored directory info (name only, for display)
// This runs in document context so can request permission if needed
export async function getStoredDirectoryInfo(): Promise<{
  name: string;
  hasPermission: boolean;
} | null> {
  const handle = await getDirectoryHandle();
  if (!handle) {
    return null;
  }

  // In document context, we can request permission
  const hasPermission = await requestDirectoryPermission(handle);
  return { name: handle.name, hasPermission };
}
