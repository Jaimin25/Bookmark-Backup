import { BookmarkNode, BackupData } from "@/types";

export async function getAllBookmarks(): Promise<BookmarkNode[]> {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      resolve(bookmarkTreeNodes as BookmarkNode[]);
    });
  });
}

export function countBookmarks(nodes: BookmarkNode[]): number {
  let count = 0;

  function traverse(node: BookmarkNode) {
    if (node.url) {
      count++;
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return count;
}

export function createBackupData(bookmarks: BookmarkNode[]): BackupData {
  const userAgent = navigator.userAgent;
  let browserInfo = "Unknown Browser";
  console.log(userAgent);
  if (userAgent.includes("Edg")) {
    browserInfo = "Microsoft Edge";
  } else if (userAgent.includes("Brave")) {
    browserInfo = "Brave Browser";
  } else if (userAgent.includes("Chrome")) {
    browserInfo = "Google Chrome";
  } else if (userAgent.includes("Safari")) {
    browserInfo = "Safari";
  }

  return {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    browserInfo,
    totalBookmarks: countBookmarks(bookmarks),
    bookmarks,
  };
}

export function exportAsJSON(data: BackupData): string {
  return JSON.stringify(data, null, 2);
}

export function exportAsHTML(data: BackupData): string {
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  function processNode(node: BookmarkNode, indent: string = "    "): string {
    let result = "";

    if (node.url) {
      const addDate = node.dateAdded
        ? ` ADD_DATE="${Math.floor(node.dateAdded / 1000)}"`
        : "";
      result += `${indent}<DT><A HREF="${escapeHtml(
        node.url
      )}"${addDate}>${escapeHtml(node.title)}</A>\n`;
    } else if (node.title) {
      const modDate = node.dateGroupModified
        ? ` LAST_MODIFIED="${Math.floor(node.dateGroupModified / 1000)}"`
        : "";
      result += `${indent}<DT><H3${modDate}>${escapeHtml(node.title)}</H3>\n`;
      result += `${indent}<DL><p>\n`;

      if (node.children) {
        node.children.forEach((child) => {
          result += processNode(child, indent + "    ");
        });
      }

      result += `${indent}</DL><p>\n`;
    } else if (node.children) {
      node.children.forEach((child) => {
        result += processNode(child, indent);
      });
    }

    return result;
  }

  data.bookmarks.forEach((node) => {
    html += processNode(node);
  });

  html += "</DL><p>\n";

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function generateFilename(format: "json" | "html"): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0];
  const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `bookmarks-backup-${dateStr}-${timeStr}.${format}`;
}

// Convert string to base64 for data URL (service workers don't have URL.createObjectURL)
function stringToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function downloadBackup(
  content: string,
  filename: string,
  mimeType: string
): Promise<void> {
  // Use data URL instead of blob URL (service workers don't support URL.createObjectURL)
  const base64Content = stringToBase64(content);
  const dataUrl = `data:${mimeType};base64,${base64Content}`;

  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url: dataUrl,
        filename,
        saveAs: false,
        conflictAction: "uniquify", // Auto-rename if file exists (no prompt)
      },
      (_downloadId) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      }
    );
  });
}
