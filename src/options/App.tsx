import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getSettings,
  saveSettings,
  getBackupHistory,
  clearBackupHistory,
} from "@/lib/storage";
import { getIntervalDescription } from "@/lib/scheduler";
import {
  pickDirectory,
  getStoredDirectoryInfo,
  clearDirectoryHandle,
} from "@/lib/filesystem";
import { BackupSettings, BackupHistoryItem, DEFAULT_SETTINGS } from "@/types";
import {
  Bookmark01Icon,
  Settings02Icon,
  Clock01Icon,
  Download01Icon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  RefreshIcon,
  FileExportIcon,
  InformationCircleIcon,
  StarIcon,
  Folder01Icon,
  AlertCircleIcon,
  CloudIcon,
  HardDriveIcon,
  ArrowDown01Icon,
  Calendar01Icon,
  Timer01Icon,
  LayoutGridIcon,
  KnightShieldIcon,
} from "@hugeicons/react";

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

// Check if File System Access API is supported (Chrome/Edge only)
const isFileSystemAccessSupported = "showDirectoryPicker" in window;

function App() {
  const [settings, setSettings] = useState<BackupSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<BackupHistoryItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [directoryInfo, setDirectoryInfo] = useState<{
    name: string;
    hasPermission: boolean;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedSettings, loadedHistory, dirInfo] = await Promise.all([
      getSettings(),
      getBackupHistory(),
      getStoredDirectoryInfo(),
    ]);
    setSettings(loadedSettings);
    setHistory(loadedHistory);
    setDirectoryInfo(dirInfo);
  };

  const handlePickDirectory = async () => {
    try {
      const result = await pickDirectory();
      if (result) {
        setDirectoryInfo({ name: result.name, hasPermission: true });
        // Update settings and save immediately
        const newSettings = {
          ...settings,
          useCustomDirectory: true,
          customDirectoryName: result.name,
        };
        setSettings(newSettings);
        await saveSettings(newSettings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to pick directory:", error);
      alert(
        "Failed to select folder. Your browser may not support this feature."
      );
    }
  };

  const handleClearDirectory = async () => {
    await clearDirectoryHandle();
    setDirectoryInfo(null);
    // Update settings and save immediately
    const newSettings = {
      ...settings,
      useCustomDirectory: false,
      customDirectoryName: undefined,
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const updateSetting = async <K extends keyof BackupSettings>(
    key: K,
    value: BackupSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Auto-save on change
    try {
      await saveSettings(newSettings);
      chrome.runtime.sendMessage({ action: "updateSchedule" });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleClearHistory = async () => {
    if (
      confirm(
        "Are you sure you want to clear all backup history? This cannot be undone."
      )
    ) {
      await clearBackupHistory();
      setHistory([]);
    }
  };

  const handleResetSettings = async () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      await saveSettings(DEFAULT_SETTINGS);
      chrome.runtime.sendMessage({ action: "updateSchedule" });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    }
  };

  const handleExportBackup = async (item: BackupHistoryItem) => {
    if (!item.data) return;

    const mimeType = item.format === "json" ? "application/json" : "text/html";

    chrome.runtime.sendMessage({
      action: "exportBackup",
      backupId: item.id,
      filename: item.filename,
      content: item.data,
      mimeType,
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
                  <Bookmark01Icon className="h-6 w-6 text-white" />
                </div>
                {settings.enabled && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-background"></span>
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Bookmark Backup
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant={settings.enabled ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {settings.enabled ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getIntervalDescription(settings)}
                  </span>
                </div>
              </div>
            </div>
            {saveSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600 animate-in fade-in duration-300">
                <CheckmarkCircle02Icon className="h-4 w-4" />
                <span>Saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="schedule" className="space-y-8">
          <TabsList className="grid w-full max-w-lg grid-cols-3 p-1 bg-muted/50 backdrop-blur">
            <TabsTrigger value="schedule" className="gap-2">
              <Timer01Icon className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="format" className="gap-2">
              <LayoutGridIcon className="h-4 w-4" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Folder01Icon className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6 animate-fade-in">
            <Card className="border-0 shadow-xl shadow-black/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Settings02Icon className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Backup Schedule</CardTitle>
                    <CardDescription>
                      Configure automatic backup timing
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                        settings.enabled ? "bg-green-500/10" : "bg-muted"
                      }`}
                    >
                      <KnightShieldIcon
                        className={`h-5 w-5 transition-colors ${
                          settings.enabled
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="enabled"
                        className="text-base font-semibold cursor-pointer"
                      >
                        Automatic Backups
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Backup your bookmarks on schedule
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="enabled"
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      updateSetting("enabled", checked)
                    }
                    className="scale-110"
                  />
                </div>

                <Separator />

                {/* Frequency & Time */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label
                      htmlFor="frequency"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Calendar01Icon className="h-4 w-4 text-muted-foreground" />
                      Frequency
                    </Label>
                    <Select
                      value={settings.frequency}
                      onValueChange={(value) =>
                        updateSetting(
                          "frequency",
                          value as BackupSettings["frequency"]
                        )
                      }
                    >
                      <SelectTrigger id="frequency" className="h-11">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Interval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="time"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <Clock01Icon className="h-4 w-4 text-muted-foreground" />
                      Backup Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={settings.backupTime}
                      onChange={(e) =>
                        updateSetting("backupTime", e.target.value)
                      }
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Conditional Fields */}
                {settings.frequency === "weekly" && (
                  <div className="space-y-3 animate-fade-in">
                    <Label htmlFor="day" className="text-sm font-medium">
                      Day of Week
                    </Label>
                    <Select
                      value={String(settings.backupDay ?? 0)}
                      onValueChange={(value) =>
                        updateSetting("backupDay", parseInt(value))
                      }
                    >
                      <SelectTrigger id="day" className="h-11 max-w-xs">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.frequency === "monthly" && (
                  <div className="space-y-3 animate-fade-in">
                    <Label htmlFor="monthday" className="text-sm font-medium">
                      Day of Month
                    </Label>
                    <Select
                      value={String(settings.backupDay ?? 1)}
                      onValueChange={(value) =>
                        updateSetting("backupDay", parseInt(value))
                      }
                    >
                      <SelectTrigger id="monthday" className="h-11 max-w-xs">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(
                          (day) => (
                            <SelectItem key={day} value={String(day)}>
                              {day}
                              {getOrdinalSuffix(day)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.frequency === "custom" && (
                  <div className="space-y-3 animate-fade-in">
                    <Label htmlFor="interval" className="text-sm font-medium">
                      Interval (days)
                    </Label>
                    <Input
                      id="interval"
                      type="number"
                      min={1}
                      max={365}
                      value={settings.customIntervalDays ?? 7}
                      onChange={(e) =>
                        updateSetting(
                          "customIntervalDays",
                          parseInt(e.target.value) || 7
                        )
                      }
                      className="h-11 max-w-[150px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="format" className="space-y-6 animate-fade-in">
            <Card className="border-0 shadow-xl shadow-black/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <FileExportIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Export Format</CardTitle>
                    <CardDescription>
                      Choose your preferred backup format
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      settings.format === "json"
                        ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    }`}
                    onClick={() => updateSetting("format", "json")}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileExportIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">JSON Format</h4>
                        <Badge variant="info" className="text-[10px] mt-0.5">
                          Recommended
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete metadata with folder structure. Best for data
                      preservation.
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      settings.format === "html"
                        ? "border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    }`}
                    onClick={() => updateSetting("format", "html")}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <FileExportIcon className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">HTML Format</h4>
                        <Badge variant="warning" className="text-[10px] mt-0.5">
                          Universal
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Netscape format. Compatible with all browsers for easy
                      import.
                    </p>
                  </button>
                </div>

                <Separator />

                {/* Storage Mode */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">
                      Storage Mode
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Where to store your backups
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                        settings.storageMode === "extension"
                          ? "border-green-500 bg-green-500/5 ring-4 ring-green-500/10"
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                      }`}
                      onClick={() => updateSetting("storageMode", "extension")}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CloudIcon className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Extension Storage</h4>
                          <Badge
                            variant="success"
                            className="text-[10px] mt-0.5"
                          >
                            ✓ No Prompts
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Silent backups stored in browser. Export manually when
                        needed.
                      </p>
                    </button>

                    <button
                      type="button"
                      className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                        settings.storageMode === "download"
                          ? "border-purple-500 bg-purple-500/5 ring-4 ring-purple-500/10"
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                      }`}
                      onClick={() => updateSetting("storageMode", "download")}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <HardDriveIcon className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Download to Disk</h4>
                          <Badge
                            variant="secondary"
                            className="text-[10px] mt-0.5"
                          >
                            May Prompt
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Download files directly. May prompt based on browser
                        settings.
                      </p>
                    </button>
                  </div>
                </div>

                {settings.storageMode === "download" && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div>
                        <Label
                          htmlFor="autoDownload"
                          className="font-medium cursor-pointer"
                        >
                          Auto Download
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically save backup files
                        </p>
                      </div>
                      <Switch
                        id="autoDownload"
                        checked={settings.autoDownload}
                        onCheckedChange={(checked) =>
                          updateSetting("autoDownload", checked)
                        }
                      />
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Folder01Icon className="h-4 w-4 text-muted-foreground" />
                        Destination Folder
                      </Label>

                      {/* Custom Directory Option - Only available in Chrome/Edge */}
                      {isFileSystemAccessSupported ? (
                        directoryInfo ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                            <Folder01Icon className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <p className="font-medium text-green-700 dark:text-green-400">
                                {directoryInfo.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {directoryInfo.hasPermission
                                  ? "Custom folder selected"
                                  : "Permission needed - click to re-authorize"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleClearDirectory}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePickDirectory}
                            className="w-full h-11 gap-2"
                          >
                            <Folder01Icon className="h-4 w-4" />
                            Choose Custom Folder
                          </Button>
                        )
                      ) : (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <p className="text-sm text-amber-700 dark:text-amber-400">
                            Custom folder selection is only available in Chrome
                            and Edge.
                          </p>
                        </div>
                      )}

                      {isFileSystemAccessSupported && (
                        <Separator className="my-2" />
                      )}

                      {/* Fallback: Downloads subfolder */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="downloadFolder"
                          className="text-xs text-muted-foreground"
                        >
                          {isFileSystemAccessSupported
                            ? "Or use Downloads subfolder:"
                            : "Downloads subfolder:"}
                        </Label>
                        <Input
                          id="downloadFolder"
                          type="text"
                          placeholder="BookmarkBackups"
                          value={settings.downloadFolder}
                          onChange={(e) =>
                            updateSetting("downloadFolder", e.target.value)
                          }
                          disabled={!!directoryInfo}
                          className="h-10"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {directoryInfo
                          ? "Backups will be saved to your custom folder."
                          : isFileSystemAccessSupported
                          ? "Choose a custom folder or specify a subfolder inside Downloads."
                          : "Specify a subfolder inside Downloads for your backups."}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Keep Count */}
                <div className="space-y-3">
                  <Label htmlFor="keepCount" className="text-sm font-medium">
                    Keep Recent Backups
                  </Label>
                  <Select
                    value={String(settings.keepBackupCount)}
                    onValueChange={(value) =>
                      updateSetting("keepBackupCount", parseInt(value))
                    }
                  >
                    <SelectTrigger
                      id="keepCount"
                      className="h-11 max-w-[200px]"
                    >
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 10, 15, 20, 50].map((count) => (
                        <SelectItem key={count} value={String(count)}>
                          {count} backups
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Older backups are automatically removed
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertCircleIcon className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-red-600 dark:text-red-400">
                      Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleResetSettings}
                  className="border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <RefreshIcon className="h-4 w-4 mr-2" />
                  Reset Settings
                </Button>
                <Button variant="destructive" onClick={handleClearHistory}>
                  <Delete02Icon className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6 animate-fade-in">
            <Card className="border-0 shadow-xl shadow-black/5">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Folder01Icon className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Backup History</CardTitle>
                      <CardDescription>Your saved backups</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {history.length} backup{history.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                      <Download01Icon className="h-7 w-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">
                      No backups yet
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Your backup history will appear here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-3">
                      {history.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                                item.format === "json"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-orange-500/10 text-orange-500"
                              }`}
                            >
                              {item.data ? (
                                <CloudIcon className="h-5 w-5" />
                              ) : (
                                <Download01Icon className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.filename}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <StarIcon className="h-3 w-3" />
                                  {item.bookmarkCount}
                                </span>
                                <span>•</span>
                                <span>{formatFileSize(item.size)}</span>
                                <span>•</span>
                                <Badge
                                  variant={
                                    item.format === "json" ? "info" : "warning"
                                  }
                                  className="text-[10px] uppercase"
                                >
                                  {item.format}
                                </Badge>
                                {item.data && (
                                  <Badge
                                    variant="success"
                                    className="text-[10px]"
                                  >
                                    Stored
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.data && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportBackup(item)}
                                className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ArrowDown01Icon className="h-4 w-4" />
                                Export
                              </Button>
                            )}
                            <p className="text-sm text-muted-foreground min-w-[120px] text-right">
                              {formatDate(item.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Alert variant="info" className="mt-8">
          <InformationCircleIcon className="h-4 w-4" />
          <AlertDescription>
            {settings.storageMode === "extension" ? (
              <>
                Backups are stored silently in your browser's extension storage.
                Use the <strong>"Export"</strong> button in History to download
                them.
                <span className="text-green-600 font-medium">
                  {" "}
                  No download prompts!
                </span>
              </>
            ) : (
              <>
                Backups are saved to your browser's download folder in the
                <strong>
                  {" "}
                  "{settings.downloadFolder || "BookmarkBackups"}"
                </strong>{" "}
                subfolder.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Bookmark Backup v1.0.0
        </p>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default App;
