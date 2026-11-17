@echo off
chcp 65001 >nul
title CastraVision - Dọn Dẹp Cache và File Rác
color 0A

:: Chuyển về thư mục gốc của dự án
cd /d "%~dp0.."

echo ===============================================================================
echo                CASTRAVISION - BỘ CÔNG CỤ DỌN DẸP CACHE VÀ FILE RÁC
echo ===============================================================================
echo Thư mục làm việc: %CD%
echo.
echo Các hạng mục sẽ được truy xuất và dọn dẹp:
echo   1. Python Cache   : __pycache__, *.pyc, *.pyo, .pytest_cache, .ruff_cache
echo   2. IDE và Editor  : .vscode, .idea
echo   3. Build Artifacts: dist, build, .vite, .vitest-cache
echo   4. Dependencies   : node_modules (CastraView và Root)
echo   5. System Cache   : pip cache, npm cache, Django cache
echo ===============================================================================
echo.
echo Nhấn phím bất kỳ để BẮT ĐẦU quá trình dọn dẹp...
pause >nul

echo.
echo -------------------------------------------------------------------------------
echo [GIAI ĐOẠN 1/5]: Đang truy xuất và xóa Python Cache...
echo -------------------------------------------------------------------------------
:: Xóa file .pyc, .pyo (loại trừ venv và .git)
for /f "delims=" %%i in ('dir /s /b /a-d *.pyc *.pyo 2^>nul ^| findstr /v /i "\\venv\\ \\\.git\\"') do (
    del /f /q "%%i" 2>nul
)
echo    [+] Đã dọn sạch các file *.pyc, *.pyo trong mã nguồn dự án.

:: Xóa toàn bộ thư mục __pycache__ ngoại trừ venv và git
for /f "delims=" %%i in ('dir /s /b /ad *__pycache__* 2^>nul ^| findstr /v /i "\\venv\\ \\\.git\\"') do (
    if exist "%%i" (
        echo    [-] Xóa: %%i
        rd /s /q "%%i" 2>nul
    )
)

:: Xóa thư mục cache test
for /f "delims=" %%i in ('dir /s /b /ad .pytest_cache .ruff_cache .mypy_cache 2^>nul ^| findstr /v /i "\\venv\\ \\\.git\\"') do (
    if exist "%%i" (
        echo    [-] Xóa: %%i
        rd /s /q "%%i" 2>nul
    )
)
echo    [OK] Hoàn tất dọn dẹp Python Cache!

echo.
echo -------------------------------------------------------------------------------
echo [GIAI ĐOẠN 2/5]: Đang truy xuất và xóa thư mục cấu hình IDE (.vscode, .idea)...
echo -------------------------------------------------------------------------------
for /f "delims=" %%i in ('dir /s /b /ad .vscode .idea 2^>nul ^| findstr /v /i "\\venv\\ \\\.git\\"') do (
    if exist "%%i" (
        echo    [-] Xóa: %%i
        rd /s /q "%%i" 2>nul
    )
)
echo    [OK] Hoàn tất dọn dẹp cấu hình IDE!

echo.
echo -------------------------------------------------------------------------------
echo [GIAI ĐOẠN 3/5]: Đang truy xuất và xóa Build Artifacts (dist, build, .vite)...
echo -------------------------------------------------------------------------------
for /f "delims=" %%i in ('dir /s /b /ad dist build .vite .vitest-cache 2^>nul ^| findstr /v /i "\\node_modules\\ \\venv\\ \\\.git\\"') do (
    if exist "%%i" (
        echo    [-] Xóa: %%i
        rd /s /q "%%i" 2>nul
    )
)
echo    [OK] Hoàn tất dọn dẹp Build Artifacts!

echo.
echo -------------------------------------------------------------------------------
echo [GIAI ĐOẠN 4/5]: Đang truy xuất và xóa Dependencies (node_modules)...
echo -------------------------------------------------------------------------------
if exist "CastraView\node_modules" (
    echo    [-] Đang xóa CastraView\node_modules - vui lòng chờ...
    rd /s /q "CastraView\node_modules" 2>nul
    echo    [+] Đã xóa CastraView\node_modules thành công!
)
if exist "node_modules" (
    echo    [-] Đang xóa node_modules ở thư mục gốc...
    rd /s /q "node_modules" 2>nul
    echo    [+] Đã xóa node_modules gốc!
)
echo    [OK] Hoàn tất dọn dẹp node_modules!

echo.
echo -------------------------------------------------------------------------------
echo [GIAI ĐOẠN 5/5]: Dọn dẹp bộ nhớ đệm Package Manager (pip, npm) và Django...
echo -------------------------------------------------------------------------------
where pip >nul 2>nul
if %errorlevel% equ 0 (
    echo    [*] Đang làm sạch pip cache...
    pip cache purge 2>nul
    echo    [+] Đã xóa pip cache!
) else (
    echo    [!] Không tìm thấy pip trong PATH, bỏ qua pip cache purge.
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo    [*] Đang làm sạch npm cache...
    npm cache clean --force 2>nul
    echo    [+] Đã xóa npm cache!
) else (
    echo    [!] Không tìm thấy npm trong PATH, bỏ qua npm cache clean.
)

if exist "manage.py" (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        echo    [*] Đang kiểm tra Django cache...
        python manage.py clear_cache 2>nul
    )
)
echo    [OK] Hoàn tất dọn dẹp Package Manager cache!

echo.
echo ===============================================================================
echo                    ĐÃ DỌN DẸP TOÀN DIỆN THÀNH CÔNG!
echo ===============================================================================
echo Các bước tiếp theo:
echo   - Để cài đặt lại thư viện Frontend: chạy "cd CastraView && npm install"
echo   - Để khởi động lại dự án: chạy "run.bat"
echo ===============================================================================
echo.
pause
