import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import { TTSService } from './services/ttsService';
import { PDFService } from './services/pdfService';
import { TextService } from './services/textService';

// ── Platform-specific Chromium flags ──
// Must be set BEFORE app.ready — works in source AND packaged builds.
if (process.platform === 'linux') {
  // Required for transparent BrowserWindow on Linux compositors (X11/Wayland)
  app.commandLine.appendSwitch('enable-transparent-visuals');
  // Prevents transparency artifacts on some Linux DEs without disabling full GPU
  app.commandLine.appendSwitch('disable-gpu-compositing');
  // Electron sandbox fix — prevents "credentials.cc: Permission denied" crash on Linux
  app.commandLine.appendSwitch('no-sandbox');
}

let mainWindow: BrowserWindow | null = null;
let ttsService: TTSService | null = null;
let pdfService: PDFService | null = null;
let textService: TextService | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    // Frameless Window Configuration - Neo-Noir Glass Monitor
    frame: false,                    // NO native chrome
    transparent: true,                // Alpha channel enabled
    backgroundColor: '#00000000',     // Fully transparent
    hasShadow: false,                 // NO OS shadow
    roundedCorners: false,            // Let CSS handle corner radius
    show: false,                      // Don't show until ready
    skipTaskbar: false,               // Still show in taskbar
    titleBarStyle: 'hidden',          // Belt-and-suspenders: hide title bar

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      experimentalFeatures: true,
      webSecurity: true,
    },
  });

  // Show window when ready to prevent visual artifacts
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:54450');
    // DevTools: open manually via Ctrl+Shift+I — do NOT auto-open on launch
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Push maximize/restore state to renderer via event (replaces 500ms polling)
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false);
  });

  createMenu();
  setupWindowControls();
}

function createMenu(): void {
  // Remove menu bar entirely for frameless experience
  Menu.setApplicationMenu(null);
}

// Window Control IPC Handlers
function setupWindowControls(): void {
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    mainWindow?.close();
  });
}

async function handleOpenFile(): Promise<void> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'All Supported', extensions: ['pdf', 'txt', 'md'] },
      { name: 'PDF Documents', extensions: ['pdf'] },
      { name: 'Text Files', extensions: ['txt', 'md'] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    mainWindow?.webContents.send('file:opened', filePath);
  }
}

function setupIPC(): void {
  // Window Controls (async handle — no sync ipcMain.on with returnValue)
  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // PDF Operations
  ipcMain.handle('pdf:open', async (_, filePath: unknown) => {
    if (typeof filePath !== 'string') throw new Error('filePath must be a string');
    return pdfService?.openDocument(filePath);
  });

  ipcMain.handle('pdf:getText', async (_, filePath: unknown, pageNum: unknown) => {
    if (typeof filePath !== 'string') throw new Error('filePath must be a string');
    if (typeof pageNum !== 'number') throw new Error('pageNum must be a number');
    return pdfService?.getPageText(filePath, pageNum);
  });

  // Text/Markdown Operations
  ipcMain.handle('text:open', async (_, filePath: unknown) => {
    if (typeof filePath !== 'string') throw new Error('filePath must be a string');
    return textService?.openDocument(filePath);
  });

  ipcMain.handle('text:getText', async (_, filePath: unknown, pageNum: unknown) => {
    if (typeof filePath !== 'string') throw new Error('filePath must be a string');
    if (typeof pageNum !== 'number') throw new Error('pageNum must be a number');
    return textService?.getPageText(filePath, pageNum);
  });

  // TTS Operations
  ipcMain.handle('tts:status', async () => {
    return ttsService?.getStatus();
  });

  ipcMain.handle('tts:voices', async () => {
    return ttsService?.getVoices();
  });

  ipcMain.handle('tts:speak', async (_, text: unknown, voice: unknown, speed: unknown) => {
    if (typeof text !== 'string') throw new Error('text must be a string');
    if (typeof voice !== 'string') throw new Error('voice must be a string');
    if (typeof speed !== 'number') throw new Error('speed must be a number');

    const result = await ttsService?.speak(text, voice, speed);
    if (result) {
      // Convert Buffer to Uint8Array for proper IPC serialization
      return {
        audio: new Uint8Array(result.audio),
        format: result.format,
      };
    }
    return null;
  });

  ipcMain.handle('tts:stop', async () => {
    return ttsService?.stop();
  });

  // File Dialog
  ipcMain.handle('dialog:openFile', async () => {
    return handleOpenFile();
  });
}

app.whenReady().then(async () => {
  ttsService = new TTSService();
  pdfService = new PDFService();
  textService = new TextService();

  setupIPC();

  // Linux requires a delay for transparent visuals to initialize
  if (process.platform === 'linux') {
    setTimeout(createWindow, 400);
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  pdfService?.cleanup();
  textService?.cleanup();
  await ttsService?.cleanup();
});
