# Bookmark Backup

<div align="center">

![Bookmark Backup](./public/icons/icon128.svg)

</div>
A beautiful, cross-browser extension to automatically backup your bookmarks on a schedule. Never lose your bookmarks again!

## 🚀 Quick Start

1. Install the extension in your browser (see [Installation](#installation))
2. Click the extension icon in your toolbar
3. Toggle "Auto Backup" to enable automatic backups
4. Click "Settings" to customize schedule and storage options
5. Click "Backup Now" for an immediate backup

That's it! Your bookmarks are now being backed up automatically.

## ✨ Features

### Core Features

- 🔄 **Automatic Scheduled Backups** - Set daily, weekly, monthly, or custom backup intervals
- ⏰ **Flexible Scheduling** - Choose specific times and days for backups
- 📁 **Multiple Export Formats** - Export as JSON (detailed) or HTML (browser-compatible)
- 🎨 **Beautiful Modern UI** - Clean interface built with React, Tailwind CSS, and shadcn/ui
- 🌐 **Cross-Browser Support** - Works on Chrome, Brave, Edge, and other Chromium browsers

### Storage Options

- ☁️ **Silent Extension Storage** - Store backups in browser storage with NO download prompts
- 💾 **Download to Disk** - Automatically save backups to your Downloads folder or custom directory
- 📂 **Custom Folder Selection** - Choose a specific folder for backups (Chrome/Edge only)
- 🗂️ **Smart History Management** - Keep track of recent backups with configurable retention

### Additional Features

- 📊 **Backup Statistics** - View total bookmarks, last backup time, and next scheduled backup
- 🚀 **One-Click Manual Backup** - Backup instantly anytime with the "Backup Now" button
- 🔒 **100% Private** - All data stays in your browser, no external servers
- 📱 **Responsive Design** - Optimized for all screen sizes

## 🌐 Supported Browsers

| Browser         | Manifest Version | Status       | Custom Folder Support |
| --------------- | ---------------- | ------------ | --------------------- |
| Google Chrome   | V3               | ✅ Supported | ✅ Yes                |
| Microsoft Edge  | V3               | ✅ Supported | ✅ Yes                |
| Brave Browser   | V3               | ✅ Supported | ✅ Yes                |
| Opera           | V3               | ✅ Supported | ✅ Yes                |
| Vivaldi         | V3               | ✅ Supported | ✅ Yes                |

**Note:** Custom folder selection uses the File System Access API, which is currently supported in Chromium-based browsers only.

## Installation

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in your browser:

#### Chrome/Brave/Edge

1. Go to `chrome://extensions/` (or `brave://extensions/` or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for production
npm run build

# Build specifically for Chrome
npm run build:chrome
```

## Project Structure

```
bookmark-backup-extension/
├── public/
│   ├── icons/              # Extension icons
│   └── manifest.json       # Chrome/Brave/Edge manifest (V3)
├── src/
│   ├── background/         # Background service worker
│   ├── components/ui/      # shadcn/ui components
│   ├── lib/                # Utility functions
│   │   ├── bookmarks.ts    # Bookmark operations
│   │   ├── scheduler.ts    # Backup scheduling
│   │   ├── storage.ts      # Chrome storage wrapper
│   │   └── utils.ts        # General utilities
│   ├── options/            # Options/Settings page
│   ├── popup/              # Extension popup
│   └── types/              # TypeScript types
├── popup.html              # Popup entry HTML
├── options.html            # Options entry HTML
└── vite.config.ts          # Vite configuration
```

## 🛠️ Tech Stack

- **React 18** - Modern UI library with hooks
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **Radix UI** - Accessible primitives
- **Hugeicons** - Beautiful, consistent icons
- **Chrome Extension APIs** - Bookmarks, Storage, Alarms, Downloads
- **File System Access API** - Custom folder selection (Chrome/Edge)

## 📦 Storage Modes

### Extension Storage (Recommended)

- **Silent backups** - No download prompts or interruptions
- Backups stored in browser's extension storage
- Export manually from the History tab when needed
- Perfect for set-it-and-forget-it automatic backups
- Limited by browser storage quota (~10MB typical)

### Download to Disk

- **Direct file downloads** - Backups saved as files
- Choose between Downloads subfolder or custom folder
- Custom folder selection (Chrome/Edge only) for precise control
- No storage limits
- May prompt for download permission based on browser settings

## 📄 Backup Formats

### JSON Format (Recommended)

Includes complete metadata:

- Export date and time
- Browser information
- Total bookmark count
- Full bookmark tree structure with dates
- Perfect for data preservation and analysis

### HTML Format (Universal)

Uses Netscape Bookmark format:

- Compatible with all browsers
- Can be imported directly into any browser
- Includes add dates and folder structure
- Best for cross-browser compatibility

## ⚙️ Configuration Options

### Schedule Settings

| Option          | Description                                       | Default |
| --------------- | ------------------------------------------------- | ------- |
| Auto Backup     | Enable/disable automatic backups                  | Enabled |
| Frequency       | How often to backup (daily/weekly/monthly/custom) | Weekly  |
| Backup Time     | Time of day to run backup                         | 09:00   |
| Backup Day      | Day of week (weekly) or month (monthly)           | Sunday  |
| Custom Interval | Custom backup interval in days                    | 7 days  |

### Storage Settings

| Option            | Description                                 | Default               |
| ----------------- | ------------------------------------------- | --------------------- |
| Export Format     | Backup file format (JSON/HTML)              | JSON                  |
| Storage Mode      | Extension storage or Download to disk       | Extension Storage     |
| Auto Download     | Automatically download backup files         | Enabled (if download) |
| Download Folder   | Subfolder in Downloads for backups          | BookmarkBackups       |
| Custom Directory  | Custom folder path (Chrome/Edge only)       | Not set               |
| Keep Backup Count | Number of recent backups to keep in history | 5                     |

## 🔒 Privacy & Security

This extension is built with privacy as a top priority:

- ✅ **Zero external connections** - No data ever leaves your browser
- ✅ **No analytics or tracking** - We don't know you exist
- ✅ **No remote servers** - Everything runs locally
- ✅ **Minimal permissions** - Only requests what's necessary (bookmarks, storage, alarms, downloads)
- ✅ **Open source** - Full transparency, audit the code yourself
- ✅ **Local storage only** - All settings and backups stay on your device

Your bookmarks are yours and yours alone!

## 💡 Tips & Best Practices

### Choosing Storage Mode

- **Use Extension Storage** if you want completely silent, automatic backups with zero interruptions
- **Use Download Mode** if you want immediate file access or have many bookmarks (>10MB)

### Recommended Settings

- **Daily backups** for active bookmark users who add/modify frequently
- **Weekly backups** for casual users (default, good balance)
- **JSON format** for complete metadata and future-proofing
- **Keep 5-10 backups** for good history without using too much space

### Backup Best Practices

1. Test your backup by exporting and checking the file
2. Periodically export your extension storage backups to disk for safety
3. Store important backups in multiple locations (cloud storage, external drive)
4. Set backup time when you typically use your browser for reliability

### Troubleshooting

- **No backups appearing?** Check that Auto Backup is enabled and browser is open at scheduled time
- **Download prompts?** Switch to Extension Storage mode for silent backups
- **Storage full?** Reduce Keep Backup Count or switch to Download mode
- **Can't select folder?** This feature requires Chrome/Edge

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

- 🐛 **Report bugs** - Open an issue with details
- 💡 **Suggest features** - Share your ideas
- 🔧 **Submit PRs** - Fix bugs or add features
- 📖 **Improve docs** - Help others understand the project
- ⭐ **Star the repo** - Show your support

## 📝 License

MIT License - feel free to use this in your own projects!
