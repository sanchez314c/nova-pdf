#!/bin/bash
#
# Nova PDF Reader - Linux Source Runner
# Clean start script with port management and Kokoro TTS
#

set -e

# ============================================
# PORT CONFIGURATION (Random High Ports)
# ============================================
ELECTRON_DEBUG_PORT=54801
ELECTRON_INSPECT_PORT=59909
ELECTRON_PORT=54450

# ============================================
# COLORS
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         Nova PDF Reader - Linux Source Runner            ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_and_kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing process on port $port ($name) - PID: $pid"
        kill -9 $pid 2>/dev/null || true
        sleep 0.5
    fi
}

kill_zombie_electrons() {
    echo -e "${BLUE}[CLEANUP]${NC} Checking for orphaned Electron processes..."
    local pids=$(pgrep -f "electron.*$(basename $(pwd))" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing orphaned Electron processes: $pids"
        echo "$pids" | xargs -r kill -9 2>/dev/null || true
        sleep 1
    fi
    local dir_pids=$(pgrep -f "electron $(pwd)" 2>/dev/null || true)
    if [ -n "$dir_pids" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing Electron processes in project dir: $dir_pids"
        echo "$dir_pids" | xargs -r kill -9 2>/dev/null || true
        sleep 1
    fi
    local vite_pids=$(pgrep -f "vite.*$ELECTRON_PORT" 2>/dev/null || true)
    if [ -n "$vite_pids" ]; then
        echo -e "${YELLOW}[CLEANUP]${NC} Killing Vite processes: $vite_pids"
        echo "$vite_pids" | xargs -r kill -9 2>/dev/null || true
        sleep 1
    fi
}

check_dependencies() {
    echo -e "${BLUE}[CHECK]${NC} Verifying dependencies..."
    if ! command -v node &> /dev/null; then
        echo -e "${RED}[ERROR]${NC} Node.js is not installed!"; exit 1
    fi
    echo -e "${GREEN}[OK]${NC} Node.js $(node --version)"
    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}[SETUP]${NC} pnpm not found, installing..."
        npm install -g pnpm
    fi
    echo -e "${GREEN}[OK]${NC} pnpm $(pnpm --version)"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[SETUP]${NC} Installing dependencies..."
        pnpm install
    fi
}

fix_linux_sandbox() {
    echo -e "${BLUE}[FIX]${NC} Checking Linux sandbox configuration..."
    local current=$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo "1")
    if [ "$current" = "0" ]; then
        echo -e "${YELLOW}[FIX]${NC} Enabling unprivileged user namespaces for Electron..."
        echo "1234" | sudo -S sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true
    fi
    echo -e "${GREEN}[OK]${NC} Sandbox configuration ready"
}

check_tts_server() {
    echo -e "${BLUE}[CHECK]${NC} Checking Kokoro TTS Server..."
    if curl -s http://localhost:8880/health > /dev/null 2>&1; then
        echo -e "${GREEN}[OK]${NC} Kokoro TTS Server already running"
    else
        echo -e "${YELLOW}[WARN]${NC} Kokoro TTS Server not running"
        echo -e "${BLUE}[INFO]${NC} To start TTS: pnpm tts:start"
        echo -e "${BLUE}[INFO]${NC} Continuing — PDF reading works without TTS"
    fi
}

# ============================================
# MAIN EXECUTION
# ============================================
cd "$(dirname "${BASH_SOURCE[0]}")"
print_header

echo -e "${BLUE}[INFO]${NC} Working directory: $(pwd)"
echo -e "${BLUE}[INFO]${NC} Configured ports:"
echo "  - Dev Server:       $ELECTRON_PORT"
echo "  - Electron Debug:   $ELECTRON_DEBUG_PORT"
echo "  - Electron Inspect: $ELECTRON_INSPECT_PORT"
echo ""

# Cleanup phase
echo -e "${CYAN}━━━ CLEANUP PHASE ━━━${NC}"
kill_zombie_electrons
check_and_kill_port $ELECTRON_DEBUG_PORT "Electron Debug"
check_and_kill_port $ELECTRON_INSPECT_PORT "Electron Inspect"
check_and_kill_port $ELECTRON_PORT "Dev Server"
echo ""

# Verification phase
echo -e "${CYAN}━━━ VERIFICATION PHASE ━━━${NC}"
check_dependencies
fix_linux_sandbox
check_tts_server
echo ""

# Launch phase
echo -e "${CYAN}━━━ LAUNCH PHASE ━━━${NC}"
echo -e "${GREEN}[START]${NC} Launching Nova PDF Reader from source..."
echo -e "${BLUE}[NOTE]${NC} Transparency/GPU/sandbox flags handled in main.js (works in packaged builds too)"
echo ""

export ELECTRON_DEBUG_PORT=$ELECTRON_DEBUG_PORT
export ELECTRON_INSPECT_PORT=$ELECTRON_INSPECT_PORT
export ELECTRON_PORT=$ELECTRON_PORT
export ELECTRON_FORCE_WINDOW_MENU_BAR=1
export ELECTRON_TRASH=gio

echo -e "${GREEN}[MODE]${NC} Development mode (run from source)"
pnpm dev
