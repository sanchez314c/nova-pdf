#!/bin/bash
# Nova TTS Server - Start Script (Self-Contained)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_DIR="$SCRIPT_DIR/.venv"

eval "$(conda shell.bash hook)"

# Check if environment exists
if [ ! -d "$ENV_DIR" ]; then
    echo "Environment not found. Running setup..."
    bash "$SCRIPT_DIR/setup.sh"
fi

conda activate "$ENV_DIR"
echo "Starting Nova TTS Server on port 8880..."
python "$SCRIPT_DIR/server.py"
