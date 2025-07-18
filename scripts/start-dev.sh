#!/bin/bash
# Nova PDF Reader - Development Launcher
# Handles Electron sandbox issues on Linux

set -e

# Enable unprivileged user namespaces for Electron sandbox
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    current_value=$(sysctl -n kernel.unprivileged_userns_clone 2>/dev/null || echo "1")
    if [[ "$current_value" == "0" ]]; then
        echo "Enabling unprivileged user namespaces for Electron..."
        echo "1234" | sudo -S sysctl -w kernel.unprivileged_userns_clone=1
    fi
fi

# Start development server
exec pnpm dev
