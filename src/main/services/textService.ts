import { readFile, stat } from 'fs/promises';
import { basename, normalize, resolve } from 'path';

interface TextDocument {
  path: string;
  numPages: number;
  title?: string;
  type: 'txt' | 'md';
}

const CHARS_PER_PAGE = 3000;

// Maximum file size to load into memory (50 MB)
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

// Maximum number of documents to keep in cache before evicting oldest
const MAX_CACHE_SIZE = 10;

/**
 * Validate that a file path is absolute and does not escape via traversal.
 */
function validateFilePath(filePath: string): string {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    throw new Error('File path must be a non-empty string');
  }
  return normalize(resolve(filePath));
}

export class TextService {
  private documentCache = new Map<string, { content: string; pages: string[] }>();
  private cacheOrder: string[] = [];

  private splitIntoPages(content: string): string[] {
    const pages: string[] = [];
    let remaining = content;

    while (remaining.length > 0) {
      if (remaining.length <= CHARS_PER_PAGE) {
        pages.push(remaining);
        break;
      }

      let splitPoint = CHARS_PER_PAGE;
      const lastNewline = remaining.lastIndexOf('\n', CHARS_PER_PAGE);
      const lastSpace = remaining.lastIndexOf(' ', CHARS_PER_PAGE);

      if (lastNewline > CHARS_PER_PAGE * 0.7) {
        splitPoint = lastNewline + 1;
      } else if (lastSpace > CHARS_PER_PAGE * 0.7) {
        splitPoint = lastSpace + 1;
      }

      pages.push(remaining.substring(0, splitPoint));
      remaining = remaining.substring(splitPoint);
    }

    return pages.length > 0 ? pages : [''];
  }

  private evictIfNeeded(): void {
    while (this.documentCache.size >= MAX_CACHE_SIZE && this.cacheOrder.length > 0) {
      const oldest = this.cacheOrder.shift()!;
      this.documentCache.delete(oldest);
    }
  }

  private cacheDocument(filePath: string, data: { content: string; pages: string[] }): void {
    if (this.documentCache.has(filePath)) {
      this.cacheOrder = this.cacheOrder.filter((p) => p !== filePath);
    } else {
      this.evictIfNeeded();
    }
    this.documentCache.set(filePath, data);
    this.cacheOrder.push(filePath);
  }

  private async loadDocument(filePath: string): Promise<{ content: string; pages: string[] }> {
    const existing = this.documentCache.get(filePath);
    if (existing) return existing;

    // Guard against huge files
    const fileInfo = await stat(filePath);
    if (fileInfo.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File too large: ${fileInfo.size} bytes (max ${MAX_FILE_SIZE_BYTES})`);
    }

    const content = await readFile(filePath, 'utf-8');
    const pages = this.splitIntoPages(content);
    const data = { content, pages };
    this.cacheDocument(filePath, data);
    return data;
  }

  async openDocument(filePath: string): Promise<TextDocument> {
    const safePath = validateFilePath(filePath);
    const cached = await this.loadDocument(safePath);
    const ext = safePath.toLowerCase().endsWith('.md') ? 'md' : 'txt';

    return {
      path: safePath,
      numPages: cached.pages.length,
      title: basename(safePath),
      type: ext,
    };
  }

  async getPageText(filePath: string, pageNum: number): Promise<string> {
    const safePath = validateFilePath(filePath);
    const cached = await this.loadDocument(safePath);

    if (!Number.isInteger(pageNum) || pageNum < 1 || pageNum > cached.pages.length) {
      throw new Error(`Invalid page number: ${pageNum}`);
    }

    return cached.pages[pageNum - 1];
  }

  cleanup(): void {
    this.documentCache.clear();
    this.cacheOrder = [];
  }
}
