import React, { useState, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

export function DropZone(): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const { setDocument, setCurrentPage, setPageText, ttsStatus } = useAppStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFile = files.find((f) => {
      const name = f.name.toLowerCase();
      return name.endsWith('.pdf') || name.endsWith('.txt') || name.endsWith('.md');
    });

    if (supportedFile) {
      try {
        // Access file path from Electron's file object
        const filePath = (supportedFile as File & { path: string }).path;
        const ext = supportedFile.name.toLowerCase().split('.').pop();
        const isTextFile = ext === 'txt' || ext === 'md';

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
        console.error('Failed to open dropped file:', error);
      }
    }
  }, [setDocument, setCurrentPage, setPageText]);

  return (
    <div
      className="flex-1 flex items-center justify-center p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`max-w-xl w-full p-12 rounded-2xl border-2 border-dashed transition-all duration-300 welcome-card ${
          isDragging
            ? 'border-[var(--accent-teal)] scale-105'
            : 'border-[var(--border-subtle)] hover:border-[var(--border-light)]'
        }`}
        style={{
          boxShadow: isDragging ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        }}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center relative overflow-hidden"
               style={{
                 background: 'var(--gradient-button)',
                 boxShadow: 'var(--shadow-glow-strong)',
               }}
          >
            {/* Ambient glow overlay */}
            <div className="absolute inset-0 opacity-50"
                 style={{
                   background: 'radial-gradient(circle at 30% 30%, var(--glass-highlight-strong), transparent 50%)',
                 }}
            />
            <svg className="w-10 h-10 text-[var(--text-inverse)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2"
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
          >
            {isDragging ? 'Drop PDF Here' : 'Open a PDF Document'}
          </h2>

          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Drag and drop a PDF file here, or click the button below
          </p>

          <button
            onClick={() => window.nova.dialog.openFile()}
            className="btn btn-primary text-lg px-8 py-3 hover-lift"
          >
            Browse Files
          </button>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2"
                   style={{
                     color: ttsStatus.running ? 'var(--success)' : 'var(--error)',
                   }}
              >
                <span className={`status-dot ${ttsStatus.running ? 'active' : 'error'}`} />
                TTS Engine: {ttsStatus.running ? (ttsStatus.gpu ? 'CUDA' : 'CPU') : 'Offline'}
              </div>
            </div>

            {!ttsStatus.running && (
              <p className="mt-4 text-xs" style={{ color: 'var(--text-dim)' }}>
                Start the TTS engine with:{' '}
                <code className="px-2 py-1 rounded text-[10px]"
                      style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--accent-blue)',
                      }}
                >
                  pnpm tts:start
                </code>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
