import React from 'react';
import { useAppStore } from '../stores/appStore';

export function PDFViewer(): React.ReactElement {
  const { document, currentPage, pageText, isLoading, goToPage } = useAppStore();

  if (!document) return <></>;

  const handlePrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < document.numPages) goToPage(currentPage + 1);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Page Navigation */}
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--glass-border)]">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="btn btn-secondary flex items-center gap-2"
          title="Previous Page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={document.numPages}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="input w-16 text-center py-1.5"
          />
          <span className="text-sm text-[var(--text-tertiary)]">of {document.numPages}</span>
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= document.numPages}
          className="btn btn-secondary flex items-center gap-2"
          title="Next Page"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Text Content */}
      <div className="flex-1 overflow-auto p-6 bg-[var(--bg-primary)]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--accent-primary)]">Loading page...</span>
            </div>
          </div>
        ) : (
          <div className="card max-w-4xl mx-auto">
            <div className="prose prose-invert max-w-none">
              <p className="text-base leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap font-light">
                {pageText || 'No text content found on this page.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
