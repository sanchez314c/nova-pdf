@echo off
echo === Running Nova PDF Reader from source (Windows) ===

if exist "package.json" (
    if not exist "node_modules" call npm install
    call npm run dev
) else if exist "requirements.txt" (
    if not exist "venv" python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt -q
    python src\main.py
)