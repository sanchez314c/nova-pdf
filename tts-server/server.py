#!/usr/bin/env python3
"""
Nova PDF Reader - Local Kokoro TTS Server
CUDA-accelerated streaming TTS without Docker
"""

import io
import torch
import soundfile as sf
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Nova TTS Server", version="1.0.0")

# CORS for Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
model = None
device = None
SAMPLE_RATE = 24000  # Kokoro default sample rate

# Available voices (Kokoro default voices)
VOICES = {
    "af_bella": {"name": "Bella (Female)", "language": "en-us"},
    "af_nicole": {"name": "Nicole (Female)", "language": "en-us"},
    "af_sarah": {"name": "Sarah (Female)", "language": "en-us"},
    "af_sky": {"name": "Sky (Female)", "language": "en-us"},
    "am_adam": {"name": "Adam (Male)", "language": "en-us"},
    "am_michael": {"name": "Michael (Male)", "language": "en-us"},
    "bf_emma": {"name": "Emma (British)", "language": "en-gb"},
    "bf_isabella": {"name": "Isabella (British)", "language": "en-gb"},
    "bm_george": {"name": "George (British)", "language": "en-gb"},
    "bm_lewis": {"name": "Lewis (British)", "language": "en-gb"},
}


class SpeechRequest(BaseModel):
    model: str = "kokoro"
    input: str
    voice: str = "af_bella"
    speed: float = 1.0
    response_format: str = "wav"
    stream: bool = False


def load_model():
    """Load Kokoro model with CUDA if available"""
    global model, device

    if model is not None:
        return

    try:
        from kokoro import KPipeline

        # Detect device
        if torch.cuda.is_available():
            device = "cuda"
            print(f"CUDA detected: {torch.cuda.get_device_name(0)}")
        else:
            device = "cpu"
            print("Running on CPU")

        # Load pipeline
        print("Loading Kokoro model...")
        model = KPipeline(lang_code="a")  # 'a' for American English
        print("Model loaded successfully!")

    except Exception as e:
        print(f"Failed to load model: {e}")
        raise


@app.on_event("startup")
async def startup_event():
    """Load model on server startup"""
    load_model()


@app.get("/")
async def root():
    return {"status": "ok", "service": "Nova TTS Server", "gpu": torch.cuda.is_available()}


@app.get("/v1/audio/voices")
async def list_voices():
    """List available voices"""
    return [
        {"id": vid, "name": info["name"], "language": info["language"]}
        for vid, info in VOICES.items()
    ]


@app.post("/v1/audio/speech")
async def create_speech(request: SpeechRequest):
    """Generate speech from text"""
    global model

    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not request.input or not request.input.strip():
        raise HTTPException(status_code=400, detail="Input text is required")

    try:
        # Generate audio
        voice = request.voice if request.voice in VOICES else "af_bella"

        # Kokoro generates audio - returns generator of (graphemes, phonemes, audio) tuples
        generator = model(
            request.input,
            voice=voice,
            speed=request.speed
        )

        # Collect audio samples - Kokoro yields (graphemes, phonemes, audio) tuples
        audio_chunks = []
        sample_rate = SAMPLE_RATE

        for result in generator:
            # KPipeline.Result object has .audio attribute
            audio_data = None
            if hasattr(result, 'audio'):
                audio_data = result.audio
            elif hasattr(result, '__getitem__'):
                try:
                    audio_data = result[2]
                except (IndexError, KeyError):
                    audio_data = result[-1]
            else:
                audio_data = result

            # Convert torch tensor to numpy if needed
            if audio_data is not None:
                if hasattr(audio_data, 'cpu'):
                    audio_data = audio_data.cpu().numpy()
                if isinstance(audio_data, np.ndarray) and audio_data.size > 0:
                    audio_data = audio_data.flatten()
                    audio_chunks.append(audio_data)

        if not audio_chunks:
            raise HTTPException(status_code=500, detail="No audio generated")

        # Concatenate all chunks
        audio = np.concatenate(audio_chunks).astype(np.float32)

        # Convert to WAV bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio, sample_rate, format="WAV")
        buffer.seek(0)

        return Response(
            content=buffer.read(),
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav"}
        )

    except Exception as e:
        print(f"TTS Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "gpu": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None
    }


if __name__ == "__main__":
    print("=" * 50)
    print("Nova TTS Server - Kokoro with CUDA")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8880, log_level="info")
