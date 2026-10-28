@echo off
setlocal
cd /d "%~dp0.."

echo [1/4] Checking Python environment...
set "PYTHON_EXE=%CD%\.venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
    where python >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python is not installed or not available in PATH.
        goto :failed
    )
    python -m venv .venv
    if errorlevel 1 goto :failed
)

"%PYTHON_EXE%" -c "import django" >nul 2>&1
if errorlevel 1 (
    echo [2/4] Installing backend dependencies...
    "%PYTHON_EXE%" -m pip install -r requirements.txt
    if errorlevel 1 goto :failed
) else (
    echo [2/4] Backend dependencies are ready.
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js and npm are not installed or not available in PATH.
    goto :failed
)

pushd CastraView
call npm ls --depth=0 >nul 2>&1
if errorlevel 1 (
    echo [3/4] Installing frontend dependencies...
    call npm ci
    if errorlevel 1 (
        popd
        goto :failed
    )
) else (
    echo [3/4] Frontend dependencies are ready.
)
popd

echo [4/4] Starting backend and frontend...
"%PYTHON_EXE%" manage.py migrate --noinput
if errorlevel 1 goto :failed
start "CastraVision Backend" "%PYTHON_EXE%" manage.py runserver 0.0.0.0:8000
start "CastraVision Frontend" cmd /k "cd /d "%CD%\CastraView" && npm run dev"

powershell -NoProfile -Command "Start-Sleep -Seconds 3"
start "" http://localhost:5173/

echo CastraVision startup commands were launched successfully.
exit /b 0

:failed
echo.
echo CastraVision startup failed. Review the error above.
pause
exit /b 1
