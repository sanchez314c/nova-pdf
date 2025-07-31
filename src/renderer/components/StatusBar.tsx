import React from 'react';
import { useAppStore } from '../stores/appStore';

interface StatusBarProps {
  version: string;
}

export function StatusBar({ version }: StatusBarProps): React.ReactElement {
  const { ttsStatus, document } = useAppStore();

  return (
    <div className="status-bar">
      <div className="status-left">
        <span
          className="status-dot"
          style={{
            background: ttsStatus.running ? 'var(--success)' : 'var(--text-dim)',
            boxShadow: ttsStatus.running ? '0 0 6px var(--success)' : 'none',
          }}
        />
        <span>TTS: {ttsStatus.running ? 'Online' : 'Offline'}</span>

        {ttsStatus.running && (
          <>
            <span style={{ color: 'var(--border-light)' }}>|</span>
            <span style={{ color: 'var(--accent-teal)', fontWeight: 500 }}>
              {ttsStatus.gpu ? 'CUDA' : 'CPU'}
            </span>
          </>
        )}

        {document && (
          <>
            <span style={{ color: 'var(--border-light)' }}>|</span>
            <span>{document.numPages} {document.numPages === 1 ? 'page' : 'pages'}</span>
          </>
        )}
      </div>

      <div className="status-right">
        <span className="app-version">v{version}</span>
      </div>
    </div>
  );
}
