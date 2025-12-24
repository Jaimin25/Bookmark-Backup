import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSettings, saveSettings, getBackupHistory } from "@/lib/storage";
import { getIntervalDescription } from "@/lib/scheduler";
import { BackupSettings, BackupHistoryItem } from "@/types";
import {
  Bookmark01Icon,
  CloudDownloadIcon,
  Clock01Icon,
  Settings02Icon,
  RefreshIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Calendar03Icon,
  Download01Icon,
  FolderOpenIcon,
  StarIcon,
  CloudIcon,
  ArrowRight01Icon,
} from "@hugeicons/react";

function App() {
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [stats, setStats] = useState({
    totalBookmarks: 0,
    lastBackup: null as number | null,
    nextBackup: null as number | null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupSuccess, setBackupSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isBackingUp) {
      const interval = setInterval(() => {
        setBackupProgress((prev) => Math.min(prev + 15, 90));
      }, 200);
      return () => clearInterval(interval);
    } else {
      setBackupProgress(0);
    }
  }, [isBackingUp]);

  const loadData = async () => {
    try {
      const [loadedSettings, loadedHistory] = await Promise.all([
        getSettings(),
        getBackupHistory(),
      ]);
      setSettings(loadedSettings);
      setHistory(loadedHistory);

      chrome.runtime.sendMessage({ action: "getStats" }, (response) => {
        if (response) {
          setStats(response);
        }
      });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!settings) return;
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    await saveSettings(newSettings);
    chrome.runtime.sendMessage({ action: "updateSchedule" });
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupSuccess(null);
    setBackupProgress(10);

    try {
      const response = await new Promise<{
        success: boolean;
        historyItem?: BackupHistoryItem;
      }>((resolve) => {
        chrome.runtime.sendMessage({ action: "performBackup" }, resolve);
      });

      setBackupProgress(100);
      setBackupSuccess(response.success);
      if (response.success && response.historyItem) {
        setHistory((prev) => [response.historyItem!, ...prev.slice(0, 4)]);
      }

      chrome.runtime.sendMessage({ action: "getStats" }, (response) => {
        if (response) {
          setStats(response);
        }
      });

      setTimeout(() => setBackupSuccess(null), 3000);
    } catch (error) {
      setBackupSuccess(false);
    } finally {
      setTimeout(() => setIsBackingUp(false), 500);
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const formatDate = (timestamp: number | null | undefined) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const formatNextBackup = (timestamp: number | null | undefined) => {
    if (!timestamp) return "Not set";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      return `${diffDays}d`;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="popup-container flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/25">
              <Bookmark01Icon className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center">
              <RefreshIcon className="h-3 w-3 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="popup-container bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Bookmark01Icon className="h-5 w-5 text-white" />
                </div>
                {settings?.enabled && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-background"></span>
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight">
                  Bookmark Backup
                </h1>
                <p className="text-[11px] text-muted-foreground">
                  {settings ? getIntervalDescription(settings) : "Loading..."}
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openSettings}
                  className="h-9 w-9 rounded-lg hover:bg-muted"
                >
                  <Settings02Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Settings</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 bg-violet-500/5 dark:bg-violet-500/10">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <StarIcon className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-base font-bold">
                    {stats.totalBookmarks}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Bookmarks
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-emerald-500/5 dark:bg-emerald-500/10">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Clock01Icon className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-base font-bold">
                    {formatDate(stats.lastBackup)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Last
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-amber-500/5 dark:bg-amber-500/10">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Calendar03Icon className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-base font-bold">
                    {formatNextBackup(stats.nextBackup)}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  Next
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Action Card */}
          <Card className="border-0 shadow-lg shadow-primary/5 overflow-hidden">
            <CardContent className="p-4 space-y-4">
              {/* Auto Backup Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-2 w-2 rounded-full transition-colors ${
                      settings?.enabled
                        ? "bg-green-500"
                        : "bg-muted-foreground/50"
                    }`}
                  />
                  <Label
                    htmlFor="auto-backup"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Auto Backup
                  </Label>
                  {settings?.enabled && (
                    <Badge
                      variant="success"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                <Switch
                  id="auto-backup"
                  checked={settings?.enabled ?? false}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>

              <Separator className="bg-border/50" />

              {/* Backup Button */}
              <div className="space-y-3">
                <Button
                  onClick={handleBackupNow}
                  disabled={isBackingUp}
                  className={`w-full h-11 text-sm font-semibold transition-all duration-300 ${
                    backupSuccess === true
                      ? "bg-green-600 hover:bg-green-600"
                      : backupSuccess === false
                      ? "bg-red-600 hover:bg-red-600"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25"
                  }`}
                >
                  {isBackingUp ? (
                    <span className="flex items-center gap-2">
                      <RefreshIcon className="h-4 w-4 animate-spin" />
                      Backing up...
                    </span>
                  ) : backupSuccess === true ? (
                    <span className="flex items-center gap-2">
                      <CheckmarkCircle02Icon className="h-4 w-4" />
                      Backup Complete!
                    </span>
                  ) : backupSuccess === false ? (
                    <span className="flex items-center gap-2">
                      <AlertCircleIcon className="h-4 w-4" />
                      Backup Failed
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CloudDownloadIcon className="h-4 w-4" />
                      Backup Now
                    </span>
                  )}
                </Button>

                {isBackingUp && (
                  <Progress
                    value={backupProgress}
                    className="h-1"
                    indicatorClassName="bg-gradient-to-r from-violet-500 to-indigo-500"
                  />
                )}

                {settings?.storageMode === "extension" && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    <CloudIcon className="inline h-3 w-3 mr-1" />
                    Saving to extension storage
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Backups */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpenIcon className="h-4 w-4 text-muted-foreground" />
                  Recent Backups
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {history.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {history.length === 0 ? (
                <div className="text-center py-6">
                  <div className="h-12 w-12 rounded-full bg-muted/50 mx-auto mb-3 flex items-center justify-center">
                    <Download01Icon className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No backups yet
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Click "Backup Now" to start
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[180px]">
                  <div className="space-y-2">
                    {history.slice(0, 5).map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                            item.format === "json"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-orange-500/10 text-orange-500"
                          }`}
                        >
                          {item.data ? (
                            <CloudIcon className="h-4 w-4" />
                          ) : (
                            <Download01Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {item.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{item.bookmarkCount} items</span>
                            <span>•</span>
                            <span>{formatFileSize(item.size)}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-muted-foreground">v1.0.0</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={openSettings}
              className="h-6 text-[10px] text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              All Settings
              <ArrowRight01Icon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
