@echo off

echo Begin kick-off stage ...


echo check directories
dir
echo runserver back-bone
start cmd /k "python manage.py runserver"

echo.
echo ===================================================
echo Server is set up
echo ===================================================
echo.

echo Begin Factors and UI/UX set-up
start cmd /k "cd Castraview && npm install && npm run build && npm run dev"

echo All stage have been kick-off.

Start http://localhost:5173/

pause


