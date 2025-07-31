import { spawn } from 'child_process';

interface TTSStatus {
  running: boolean;
  gpu: boolean;
  voices?: string[];
  error?: string;
}

interface Voice {
  id: string;
  name: string;
  language: string;
}

interface AudioResult {
  audio: Buffer;
  format: string;
}

const KOKORO_API_URL = 'http://localhost:8880';

// Maximum TTS text length to prevent abuse / runaway requests
const MAX_TTS_TEXT_LENGTH = 10_000;

// Allowed voice IDs (alphanumeric + underscore only)
const VOICE_ID_PATTERN = /^[a-z]{2}_[a-z0-9_]{2,30}$/;

function validateVoice(voice: string): string {
  if (!VOICE_ID_PATTERN.test(voice)) {
    throw new Error(`Invalid voice ID: ${voice}`);
  }
  return voice;
}

function validateSpeed(speed: number): number {
  if (typeof speed !== 'number' || isNaN(speed)) {
    throw new Error('Speed must be a number');
  }
  return Math.max(0.25, Math.min(4.0, speed));
}

function validateText(text: string): string {
  if (typeof text !== 'string') {
    throw new Error('Text must be a string');
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Text cannot be empty');
  }
  if (trimmed.length > MAX_TTS_TEXT_LENGTH) {
    throw new Error(`Text exceeds maximum length of ${MAX_TTS_TEXT_LENGTH} characters`);
  }
  return trimmed;
}

export class TTSService {
  private abortController: AbortController | null = null;

  async getStatus(): Promise<TTSStatus> {
    try {
      const response = await fetch(`${KOKORO_API_URL}/v1/audio/voices`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const voices = await response.json();
        return {
          running: true,
          gpu: true, // Assume GPU if docker GPU container is running
          voices: Array.isArray(voices) ? voices.map((v: { id: string }) => v.id) : [],
        };
      }
      return { running: false, gpu: false };
    } catch {
      return { running: false, gpu: false };
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${KOKORO_API_URL}/v1/audio/voices`);
      if (!response.ok) throw new Error('Failed to fetch voices');

      const voices = await response.json() as Array<{ id: string; name?: string; language?: string }>;
      return voices.map((v) => ({
        id: v.id,
        name: v.name || v.id,
        language: v.language || 'en',
      }));
    } catch (error) {
      console.error('Failed to get voices:', error);
      return this.getDefaultVoices();
    }
  }

  private getDefaultVoices(): Voice[] {
    return [
      { id: 'af_bella', name: 'Bella (Female)', language: 'en' },
      { id: 'af_nicole', name: 'Nicole (Female)', language: 'en' },
      { id: 'af_sarah', name: 'Sarah (Female)', language: 'en' },
      { id: 'af_sky', name: 'Sky (Female)', language: 'en' },
      { id: 'am_adam', name: 'Adam (Male)', language: 'en' },
      { id: 'am_michael', name: 'Michael (Male)', language: 'en' },
      { id: 'bf_emma', name: 'Emma (British Female)', language: 'en-gb' },
      { id: 'bf_isabella', name: 'Isabella (British Female)', language: 'en-gb' },
      { id: 'bm_george', name: 'George (British Male)', language: 'en-gb' },
      { id: 'bm_lewis', name: 'Lewis (British Male)', language: 'en-gb' },
    ];
  }

  async speak(text: string, voice: string, speed: number = 1.0): Promise<AudioResult> {
    const safeText = validateText(text);
    const safeVoice = validateVoice(voice || 'af_bella');
    const safeSpeed = validateSpeed(speed);

    // Abort any previously in-flight request before starting a new one
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const response = await fetch(`${KOKORO_API_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'kokoro',
        input: safeText,
        voice: safeVoice,
        speed: safeSpeed,
        response_format: 'wav',
      }),
      signal: this.abortController.signal,
    });

    // Clear controller reference once the request completes
    this.abortController = null;

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return { audio: audioBuffer, format: 'wav' };
  }

  async stop(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async stopEngine(): Promise<void> {
    // Stop container by name — wait for completion to avoid orphaned containers
    await new Promise<void>((resolve) => {
      const proc = spawn('docker', ['stop', 'nova-kokoro-tts'], { stdio: 'ignore' });
      proc.on('close', () => resolve());
      proc.on('error', () => resolve()); // Docker may not be running — that's fine
    });
  }

  async cleanup(): Promise<void> {
    await this.stop();
    await this.stopEngine();
  }
}
