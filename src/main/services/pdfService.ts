import { readFile } from 'fs/promises';
import { resolve, normalize } from 'path';

// pdfjs-dist v4 is ESM-only. Electron main compiles to CommonJS.
// We use dynamic import() to load it at runtime.
type PDFJSLib = typeof import('pdfjs-dist');
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy;

let pdfjsLib: PDFJSLib | null = null;

async function getPdfjs(): Promise<PDFJSLib> {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
  }
  return pdfjsLib;
}

interface PDFDocument {
  path: string;
  numPages: number;
  title?: string;
}

// Maximum number of documents to keep in cache before evicting oldest
const MAX_CACHE_SIZE = 10;

/**
 * Validate that a file path is absolute and does not escape via traversal.
 * We normalize it to prevent ../../../etc/passwd style attacks.
 */
function validateFilePath(filePath: string): string {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    throw new Error('File path must be a non-empty string');
  }
  const normalized = normalize(resolve(filePath));
  return normalized;
}

export class PDFService {
  private documentCache = new Map<string, PDFDocumentProxy>();
  private cacheOrder: string[] = [];

  private evictIfNeeded(): void {
    while (this.documentCache.size >= MAX_CACHE_SIZE && this.cacheOrder.length > 0) {
      const oldest = this.cacheOrder.shift()!;
      const doc = this.documentCache.get(oldest);
      if (doc) {
        doc.destroy();
        this.documentCache.delete(oldest);
      }
    }
  }

  private cacheDocument(filePath: string, pdf: PDFDocumentProxy): void {
    if (this.documentCache.has(filePath)) {
      this.cacheOrder = this.cacheOrder.filter((p) => p !== filePath);
    } else {
      this.evictIfNeeded();
    }
    this.documentCache.set(filePath, pdf);
    this.cacheOrder.push(filePath);
  }

  private async loadDocument(filePath: string): Promise<PDFDocumentProxy> {
    const existing = this.documentCache.get(filePath);
    if (existing) return existing;

    const pdfjs = await getPdfjs();
    const buffer = await readFile(filePath);
    const data = new Uint8Array(buffer);
    const pdf = await pdfjs.getDocument({ data }).promise;
    this.cacheDocument(filePath, pdf);
    return pdf;
  }

  async openDocument(filePath: string): Promise<PDFDocument> {
    const safePath = validateFilePath(filePath);
    const pdf = await this.loadDocument(safePath);
    const metadata = await pdf.getMetadata();
    const info = metadata?.info as Record<string, string> | undefined;

    return {
      path: safePath,
      numPages: pdf.numPages,
      title: info?.Title || undefined,
    };
  }

  async getPageText(filePath: string, pageNum: number): Promise<string> {
    const safePath = validateFilePath(filePath);
    const pdf = await this.loadDocument(safePath);

    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > pdf.numPages) {
      throw new Error(`Invalid page number: ${pageNum}`);
    }

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const text = textContent.items
      .filter((item) => 'str' in item && typeof (item as { str: string }).str === 'string')
      .map((item) => (item as { str: string }).str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }

  cleanup(): void {
    for (const pdf of this.documentCache.values()) {
      pdf.destroy();
    }
    this.documentCache.clear();
    this.cacheOrder = [];
  }
}
