@echo off
title Xoa thu muc __pycache__
echo Dang tim va xoa cac thu muc __pycache__, .vscode, node_modules .

for /d /r . %%d in (__pycache__) do @if exist "%%d" (
    rd /s /q "%%d"
    echo Da xoa: "%%d"
)

echo.
echo Hoan thanh xoa tat ca thu muc __pycache__!
pause

for /d /r . %%d in (.vscode) do @if exist "%%d" (
    rd /s /q "%%d"
    echo Da xoa: "%%d"
)


echo.
echo Hoan thanh xoa tat ca thu muc .vscode !
pause


for /d /r . %%d in (node_modules) do @if exist "%%d" (
    rd /s /q "%%d"
    echo Da xoa: "%%d"
)


echo.
echo Hoan thanh xoa tat ca thu muc node_modules !
pause



