#!/bin/bash
# Nova TTS Server - Self-Contained Setup
# CUDA 11.8 / cuDNN 8.7 / Driver 470 compatible
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="$SCRIPT_DIR/.venv"

echo "=================================="
echo "Nova TTS Server Setup"
echo "CUDA 11.8 / Driver 470"
echo "=================================="

# Check for conda
if ! command -v conda &> /dev/null; then
    echo "ERROR: conda not found."
    exit 1
fi

eval "$(conda shell.bash hook)"

# Remove old environment if exists
if [ -d "$ENV_DIR" ]; then
    echo "Removing old environment..."
    rm -rf "$ENV_DIR"
fi

# Create local environment
echo "Creating self-contained environment..."
conda create -p "$ENV_DIR" python=3.11 -y

# Activate
conda activate "$ENV_DIR"

# Install PyTorch 2.1.2 with CUDA 11.8
echo "Installing PyTorch 2.1.2+cu118..."
pip install torch==2.1.2+cu118 torchvision==0.16.2+cu118 torchaudio==2.1.2+cu118 --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
echo "Installing Kokoro TTS and dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt"

echo ""
echo "=================================="
echo "Setup complete!"
echo "Environment: $ENV_DIR"
echo "=================================="
