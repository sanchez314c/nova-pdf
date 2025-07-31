import React from 'react';
import { useAppStore } from '../stores/appStore';

interface HeaderProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  isMaximized: boolean;
  onAboutOpen: () => void;
}

export function Header({
  onMinimize,
  onMaximize,
  onClose,
  isMaximized,
  onAboutOpen,
}: HeaderProps): React.ReactElement {
  const { document, toggleSidebar } = useAppStore();

  return (
    <header className="title-bar">
      {/* Left: hamburger + icon + app name + tagline — all on ONE row */}
      <div className="title-bar-left">
        <button
          onClick={toggleSidebar}
          className="btn-icon no-drag"
          title="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow"
          style={{ background: 'var(--gradient-button)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            style={{ color: 'var(--text-inverse)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        <span
          className="text-sm font-semibold select-none"
          style={{ color: 'var(--text-heading)' }}
        >
          Nova PDF
        </span>

        <span
          className="text-xs select-none"
          style={{ color: 'var(--text-muted)' }}
        >
          Reader
        </span>

        {document && (
          <span
            className="text-xs select-none truncate max-w-xs hidden sm:inline"
            style={{ color: 'var(--text-secondary)', marginLeft: 8 }}
          >
            — {document.title || document.path.split('/').pop()}
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="title-bar-center" />

      {/* Right: TTS badge + Open PDF + About icon + window controls */}
      <div className="title-bar-right">
        {/* Open PDF Button */}
        <button
          onClick={() => window.nova.dialog.openFile()}
          className="btn btn-primary text-xs no-drag"
        >
          Open PDF
        </button>

        {/* About — flat icon, no background circle */}
        <button
          onClick={onAboutOpen}
          className="title-bar-action"
          title="About Nova PDF"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>

        {/* Window Controls */}
        <div className="window-controls">
          <button
            onClick={onMinimize}
            className="window-control"
            title="Minimize"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 12h12" />
            </svg>
          </button>

          <button
            onClick={onMaximize}
            className="window-control"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="4" width="12" height="12" rx="2" />
                <path d="M16 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h2" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            )}
          </button>

          <button
            onClick={onClose}
            className="window-control close"
            title="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 7l10 10M17 7L7 17" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
