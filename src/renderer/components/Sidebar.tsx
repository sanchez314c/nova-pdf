import React from 'react';
import { useAppStore } from '../stores/appStore';

export function Sidebar(): React.ReactElement {
  const { sidebarOpen, document, currentPage, goToPage } = useAppStore();

  if (!sidebarOpen) return <></>;

  return (
    <aside className="sidebar">
      {document ? (
        <div className="flex-1 overflow-auto p-4" style={{ marginTop: 4 }}>
          <h3
            className="font-semibold mb-3 uppercase tracking-widest"
            style={{ color: 'var(--text-secondary)', fontSize: 10, letterSpacing: '1.5px' }}
          >
            Pages
          </h3>
          <div className="space-y-1">
            {Array.from({ length: Math.min(document.numPages, 50) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-full p-2 rounded-md text-left transition-all nav-item${
                  page === currentPage ? ' active' : ''
                }`}
              >
                <span className="text-sm font-medium">Page {page}</span>
              </button>
            ))}
            {document.numPages > 50 && (
              <div
                className="text-xs text-center py-2"
                style={{ color: 'var(--text-muted)' }}
              >
                +{document.numPages - 50} more pages
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
            No document open
          </span>
        </div>
      )}
    </aside>
  );
}
