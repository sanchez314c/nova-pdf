#!/bin/bash
# Nova PDF Reader - Production Launcher
# Handles Electron sandbox issues on Linux

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Check if kernel.unprivileged_userns_clone is enabled
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    current_value=$(sysctl -n kernel.unprivileged_userns_clone 2>/dev/null || echo "1")
    if [[ "$current_value" == "0" ]]; then
        echo "WARNING: Electron requires unprivileged user namespaces."
        echo "Run: sudo sysctl -w kernel.unprivileged_userns_clone=1"
        echo ""
        echo "Launching with --no-sandbox flag as fallback..."
        export ELECTRON_DISABLE_SANDBOX=1
    fi
fi

# Check if TTS engine is running
if ! curl -s http://localhost:8880/v1/audio/voices > /dev/null 2>&1; then
    echo "TTS Engine is not running. Start it with: pnpm tts:start"
    echo ""
fi

# Launch application
cd "$APP_DIR"
if [[ -n "$ELECTRON_DISABLE_SANDBOX" ]]; then
    exec electron . --no-sandbox
else
    exec electron .
fi
