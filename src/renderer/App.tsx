import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import { Header } from './components/Header';
import { PDFViewer } from './components/PDFViewer';
import { TTSControls } from './components/TTSControls';
import { DropZone } from './components/DropZone';
import { Sidebar } from './components/Sidebar';
import { AboutModal } from './components/AboutModal';
import { StatusBar } from './components/StatusBar';

const APP_VERSION = '1.0.0';

declare global {
  interface Window {
    nova: {
      pdf: {
        open: (filePath: string) => Promise<{ path: string; numPages: number; title?: string }>;
        getText: (filePath: string, pageNum: number) => Promise<string>;
      };
      text: {
        open: (filePath: string) => Promise<{ path: string; numPages: number; title?: string; type: 'txt' | 'md' }>;
        getText: (filePath: string, pageNum: number) => Promise<string>;
      };
      tts: {
        status: () => Promise<{ running: boolean; gpu: boolean; voices?: string[] }>;
        voices: () => Promise<Array<{ id: string; name: string; language: string }>>;
        speak: (text: string, voice: string, speed: number) => Promise<{ audio: ArrayBuffer; format: string }>;
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
    };
  }
}

export default function App(): React.ReactElement {
  const { document, setDocument, setCurrentPage, setPageText, checkTTSStatus } = useAppStore();
  const [isMaximized, setIsMaximized] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Window control handlers
  const handleMinimize = () => {
    window.nova.window.minimize();
  };

  const handleMaximize = () => {
    window.nova.window.maximize();
  };

  const handleClose = () => {
    window.nova.window.close();
  };

  // Sync initial maximize state once on mount, then use event-driven updates.
  useEffect(() => {
    let mounted = true;

    window.nova.window.isMaximized().then((maximized) => {
      if (mounted) setIsMaximized(maximized);
    });

    const handleMaximizedChanged = (...args: unknown[]) => {
      if (mounted) setIsMaximized(args[0] as boolean);
    };

    window.nova.on('window:maximized-changed', handleMaximizedChanged);

    return () => {
      mounted = false;
      window.nova.off('window:maximized-changed', handleMaximizedChanged);
    };
  }, []);

  useEffect(() => {
    checkTTSStatus();

    const handleFileOpened = async (...args: unknown[]) => {
      const filePath = args[0] as string;
      if (typeof filePath !== 'string') return;

      const ext = filePath.toLowerCase().split('.').pop();
      const isTextFile = ext === 'txt' || ext === 'md';

      try {
        const doc = isTextFile
          ? await window.nova.text.open(filePath)
          : await window.nova.pdf.open(filePath);

        setDocument({ ...doc, fileType: isTextFile ? 'text' : 'pdf' });

        if (doc.numPages > 0) {
          setCurrentPage(1);
          const text = isTextFile
            ? await window.nova.text.getText(filePath, 1)
            : await window.nova.pdf.getText(filePath, 1);
          setPageText(text);
        }
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    };

    window.nova.on('file:opened', handleFileOpened);

    return () => {
      window.nova.off('file:opened', handleFileOpened);
    };
  }, [setDocument, setCurrentPage, setPageText, checkTTSStatus]);

  return (
    <div className="electron-app-root">
      {/* Custom Title Bar */}
      <Header
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
        isMaximized={isMaximized}
        onAboutOpen={() => setAboutOpen(true)}
      />

      {/* Main App Content */}
      <div className="app-content">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {document ? (
            <>
              <PDFViewer />
              <TTSControls />
            </>
          ) : (
            <DropZone />
          )}
        </main>
      </div>

      {/* Status Bar Footer */}
      <StatusBar version={APP_VERSION} />

      {/* About Modal */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        version={APP_VERSION}
      />
    </div>
  );
}
