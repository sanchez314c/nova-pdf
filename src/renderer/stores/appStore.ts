import { create } from 'zustand';

interface Document {
  path: string;
  numPages: number;
  title?: string;
  fileType?: 'pdf' | 'text';
}

interface Voice {
  id: string;
  name: string;
  language: string;
}

interface TTSStatus {
  running: boolean;
  gpu: boolean;
}

interface AppState {
  // Document State
  document: Document | null;
  currentPage: number;
  pageText: string;
  isLoading: boolean;

  // TTS State
  ttsStatus: TTSStatus;
  voices: Voice[];
  selectedVoice: string;
  speed: number;
  isPlaying: boolean;
  isPaused: boolean;

  // UI State
  sidebarOpen: boolean;

  // Actions
  setDocument: (doc: Document | null) => void;
  setCurrentPage: (page: number) => void;
  setPageText: (text: string) => void;
  setIsLoading: (loading: boolean) => void;

  setSelectedVoice: (voice: string) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsPaused: (paused: boolean) => void;

  toggleSidebar: () => void;

  // Async Actions
  checkTTSStatus: () => Promise<void>;
  loadVoices: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // PDF State
  document: null,
  currentPage: 1,
  pageText: '',
  isLoading: false,

  // TTS State
  ttsStatus: { running: false, gpu: false },
  voices: [],
  selectedVoice: 'af_bella',
  speed: 1.0,
  isPlaying: false,
  isPaused: false,

  // UI State
  sidebarOpen: true,

  // Actions
  setDocument: (doc) => set({ document: doc, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageText: (text) => set({ pageText: text }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setSpeed: (speed) => set({ speed: Math.max(0.5, Math.min(2.0, speed)) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setIsPaused: (paused) => set({ isPaused: paused }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Async Actions
  checkTTSStatus: async () => {
    try {
      const status = await window.nova.tts.status();
      set({ ttsStatus: status });
      if (status.running) {
        get().loadVoices();
      }
    } catch (error) {
      console.error('Failed to check TTS status:', error);
      set({ ttsStatus: { running: false, gpu: false } });
    }
  },

  loadVoices: async () => {
    try {
      const voices = await window.nova.tts.voices();
      set({ voices });
      if (voices.length > 0 && !get().selectedVoice) {
        set({ selectedVoice: voices[0].id });
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  },

  goToPage: async (page: number) => {
    const { document } = get();
    if (!document) return;

    const validPage = Math.max(1, Math.min(page, document.numPages));
    set({ isLoading: true, currentPage: validPage });

    try {
      const text = document.fileType === 'text'
        ? await window.nova.text.getText(document.path, validPage)
        : await window.nova.pdf.getText(document.path, validPage);
      set({ pageText: text, isLoading: false });
    } catch (error) {
      console.error('Failed to get page text:', error);
      set({ isLoading: false });
    }
  },
}));
