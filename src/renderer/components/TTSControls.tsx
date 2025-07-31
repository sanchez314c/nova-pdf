import React, { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/appStore';

// Track the current blob URL so we can revoke it after playback ends
let currentBlobUrl: string | null = null;

// Sanitize text for TTS - remove markdown, URLs, and other non-speech elements
function sanitizeForTTS(text: string): string {
  return text
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // Remove markdown headers (##, ###, etc.)
    .replace(/^#{1,6}\s*/gm, '')
    // Remove bold/italic markers (**text**, *text*, __text__, _text_)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove strikethrough (~~text~~)
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove markdown links [text](url) - keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove bullet points and list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove blockquotes
    .replace(/^>\s*/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function TTSControls(): React.ReactElement {
  const {
    document,
    currentPage,
    pageText,
    ttsStatus,
    voices,
    selectedVoice,
    speed,
    isPlaying,
    isPaused,
    setSelectedVoice,
    setSpeed,
    setIsPlaying,
    setIsPaused,
    goToPage,
  } = useAppStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldContinueRef = useRef<boolean>(false);
  const waitingForPageRef = useRef<boolean>(false);

  const playCurrentPageDirect = useCallback(async () => {
    const state = useAppStore.getState();
    if (!state.pageText || !state.ttsStatus.running) return;

    const cleanText = sanitizeForTTS(state.pageText);
    if (!cleanText) return;

    try {
      setIsPlaying(true);
      setIsPaused(false);

      const result = await window.nova.tts.speak(cleanText, state.selectedVoice, state.speed);

      const blob = new Blob([result.audio], { type: `audio/${result.format || 'wav'}` });

      // Revoke the previous blob URL before creating a new one to prevent memory leaks
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
      }

      const url = URL.createObjectURL(blob);
      currentBlobUrl = url;

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = state.speed;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('TTS playback failed:', error);
      setIsPlaying(false);
      shouldContinueRef.current = false;
    }
  }, [setIsPlaying, setIsPaused]);

  // Auto-play when page text changes and we're waiting for it
  useEffect(() => {
    if (waitingForPageRef.current && pageText && shouldContinueRef.current) {
      waitingForPageRef.current = false;
      playCurrentPageDirect();
    }
  }, [pageText, playCurrentPageDirect]);

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
    };
  }, []);

  const handlePlay = async () => {
    shouldContinueRef.current = true;
    await playCurrentPageDirect();
  };

  const handlePause = () => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStop = async () => {
    shouldContinueRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    // Revoke blob URL to free memory
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    await window.nova.tts.stop();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const handleAudioEnded = async () => {
    // Revoke the blob URL now that playback is done
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }

    // Auto-continue to next page if available
    if (shouldContinueRef.current && document && currentPage < document.numPages) {
      waitingForPageRef.current = true;
      await goToPage(currentPage + 1);
    } else {
      setIsPlaying(false);
      setIsPaused(false);
      shouldContinueRef.current = false;
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] backdrop-blur-sm border-t border-[var(--glass-border)] p-4">
      <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />

      <div className="max-w-4xl mx-auto flex items-center gap-6">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={!ttsStatus.running || !pageText}
              className="btn-circular bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:shadow-glow-accent disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed flex items-center justify-center transition-all hover-lift"
              title="Play"
            >
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="btn-circular bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:shadow-glow-accent flex items-center justify-center transition-all hover-lift"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              )}
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="btn-icon disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-disabled)]"
            title="Stop"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>

        {/* Voice Selection */}
        <div className="flex-1 max-w-xs">
          <label className="block text-xs text-[var(--text-tertiary)] mb-1 tracking-wide uppercase">Voice</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            disabled={isPlaying}
            className="select text-sm"
          >
            {voices.length > 0 ? (
              voices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))
            ) : (
              <>
                <option value="af_bella">Bella (Female)</option>
                <option value="af_nicole">Nicole (Female)</option>
                <option value="af_sarah">Sarah (Female)</option>
                <option value="am_adam">Adam (Male)</option>
                <option value="am_michael">Michael (Male)</option>
                <option value="bf_emma">Emma (British)</option>
                <option value="bm_george">George (British)</option>
              </>
            )}
          </select>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-[var(--text-tertiary)] tracking-wide uppercase">Speed</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            disabled={isPlaying}
            className="w-24 accent-[var(--accent-primary)]"
          />
          <span className="text-sm font-mono w-12 text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded text-center">{speed.toFixed(1)}x</span>
        </div>

        {/* Page Info */}
        {document && (
          <div className="text-sm text-[var(--text-tertiary)]">
            Page <span className="text-[var(--accent-primary)] font-medium">{currentPage}</span> of {document.numPages}
          </div>
        )}

        {/* Status */}
        <div className={`text-sm font-medium ${
          isPlaying ? 'text-[var(--accent-primary)]' : isPaused ? 'text-[var(--color-warning)]' : 'text-[var(--text-tertiary)]'
        }`}>
          {isPlaying ? (isPaused ? 'Paused' : 'Playing...') : 'Ready'}
        </div>
      </div>
    </div>
  );
}
