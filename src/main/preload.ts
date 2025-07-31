import { contextBridge, ipcRenderer } from 'electron';

export interface NovaAPI {
  pdf: {
    open: (filePath: string) => Promise<PDFDocument>;
    getText: (filePath: string, pageNum: number) => Promise<string>;
  };
  text: {
    open: (filePath: string) => Promise<TextDocument>;
    getText: (filePath: string, pageNum: number) => Promise<string>;
  };
  tts: {
    status: () => Promise<TTSStatus>;
    voices: () => Promise<Voice[]>;
    speak: (text: string, voice: string, speed: number) => Promise<AudioResult>;
    stop: () => Promise<void>;
  };
  dialog: {
    openFile: () => Promise<void>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
  };
  on: (channel: string, callback: (...args: unknown[]) => void) => void;
  off: (channel: string, callback: (...args: unknown[]) => void) => void;
}

interface PDFDocument {
  path: string;
  numPages: number;
  title?: string;
}

interface TextDocument {
  path: string;
  numPages: number;
  title?: string;
  type: 'txt' | 'md';
}

interface TTSStatus {
  running: boolean;
  gpu: boolean;
  voices?: string[];
}

interface Voice {
  id: string;
  name: string;
  language: string;
}

interface AudioResult {
  audio: ArrayBuffer;
  format: string;
}

// Allowlist of channels the renderer is permitted to listen on.
// Any channel not in this list is silently ignored.
const validChannels = ['file:opened', 'window:maximized-changed'] as const;
type ValidChannel = (typeof validChannels)[number];

function isValidChannel(channel: string): channel is ValidChannel {
  return (validChannels as readonly string[]).includes(channel);
}

// Maps the user-supplied callback to the IPC wrapper function that was
// actually registered with ipcRenderer.on(), so removeListener() receives
// the correct reference and the listener is truly removed.
type IpcCallback = (...args: unknown[]) => void;
// IpcRendererEvent is the first arg ipcRenderer.on() passes to every listener.
// Typing it as the structural shape avoids an explicit Electron namespace import.
type IpcWrapper = (event: { sender: unknown }, ...args: unknown[]) => void;
const listenerMap = new Map<IpcCallback, IpcWrapper>();

contextBridge.exposeInMainWorld('nova', {
  pdf: {
    open: (filePath: string) => ipcRenderer.invoke('pdf:open', filePath),
    getText: (filePath: string, pageNum: number) =>
      ipcRenderer.invoke('pdf:getText', filePath, pageNum),
  },
  text: {
    open: (filePath: string) => ipcRenderer.invoke('text:open', filePath),
    getText: (filePath: string, pageNum: number) =>
      ipcRenderer.invoke('text:getText', filePath, pageNum),
  },
  tts: {
    status: () => ipcRenderer.invoke('tts:status'),
    voices: () => ipcRenderer.invoke('tts:voices'),
    speak: (text: string, voice: string, speed: number) =>
      ipcRenderer.invoke('tts:speak', text, voice, speed),
    stop: () => ipcRenderer.invoke('tts:stop'),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
  },
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  },
  on: (channel: string, callback: IpcCallback) => {
    if (isValidChannel(channel)) {
      const wrapper: IpcWrapper = (_, ...args) => callback(...args);
      listenerMap.set(callback, wrapper);
      ipcRenderer.on(channel, wrapper);
    }
  },
  off: (channel: string, callback: IpcCallback) => {
    if (isValidChannel(channel)) {
      const wrapper = listenerMap.get(callback);
      if (wrapper) {
        ipcRenderer.removeListener(channel, wrapper);
        listenerMap.delete(callback);
      }
    }
  },
} as NovaAPI);
