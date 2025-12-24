import { BackupSettings } from '@/types';

const ALARM_NAME = 'bookmark-backup-alarm';

export function calculateNextBackupTime(settings: BackupSettings): number {
  const now = new Date();
  const [hours, minutes] = settings.backupTime.split(':').map(Number);
  
  let nextBackup = new Date(now);
  nextBackup.setHours(hours, minutes, 0, 0);
  
  switch (settings.frequency) {
    case 'daily':
      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const targetDay = settings.backupDay ?? 0;
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextBackup <= now)) {
        daysUntilTarget += 7;
      }
      
      nextBackup.setDate(nextBackup.getDate() + daysUntilTarget);
      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + 7);
      }
      break;
      
    case 'monthly':
      const targetDate = settings.backupDay ?? 1;
      nextBackup.setDate(targetDate);
      
      if (nextBackup <= now) {
        nextBackup.setMonth(nextBackup.getMonth() + 1);
      }
      
      // Handle months with fewer days
      while (nextBackup.getDate() !== targetDate) {
        nextBackup.setDate(0); // Go to last day of previous month
        nextBackup.setDate(targetDate);
      }
      break;
      
    case 'custom':
      const intervalDays = settings.customIntervalDays ?? 7;
      if (nextBackup <= now) {
        nextBackup.setDate(nextBackup.getDate() + intervalDays);
      }
      break;
  }
  
  return nextBackup.getTime();
}

export async function scheduleBackup(settings: BackupSettings): Promise<number> {
  // Clear existing alarm
  await chrome.alarms.clear(ALARM_NAME);
  
  if (!settings.enabled) {
    return 0;
  }
  
  const nextBackupTime = calculateNextBackupTime(settings);
  
  await chrome.alarms.create(ALARM_NAME, {
    when: nextBackupTime,
  });
  
  return nextBackupTime;
}

export async function getNextScheduledBackup(): Promise<chrome.alarms.Alarm | null> {
  return new Promise((resolve) => {
    chrome.alarms.get(ALARM_NAME, (alarm) => {
      resolve(alarm || null);
    });
  });
}

export function getIntervalDescription(settings: BackupSettings): string {
  switch (settings.frequency) {
    case 'daily':
      return `Daily at ${settings.backupTime}`;
    case 'weekly':
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Every ${days[settings.backupDay ?? 0]} at ${settings.backupTime}`;
    case 'monthly':
      const suffix = getOrdinalSuffix(settings.backupDay ?? 1);
      return `Every ${settings.backupDay}${suffix} of the month at ${settings.backupTime}`;
    case 'custom':
      return `Every ${settings.customIntervalDays} days at ${settings.backupTime}`;
    default:
      return 'Not scheduled';
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

