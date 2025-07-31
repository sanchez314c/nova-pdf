#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Running Nova PDF Reader from source (macOS) ==="

if [ -f "package.json" ]; then
    [ ! -d "node_modules" ] && npm install
    npm run dev 2>/dev/null || npm run start 2>/dev/null || npm start
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    [ ! -d "venv" ] && python3 -m venv venv
    source venv/bin/activate
    [ -f "requirements.txt" ] && pip install -r requirements.txt -q
    python src/main.py 2>/dev/null || python main.py
fi