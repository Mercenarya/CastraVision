@echo off
title CACHE REMOVER

echo Begin Removal Stages...

cd ..

echo [1]: Python dependencies cache purging
start cmd /k "pip cache purge"
pause

echo [2]: Node module cleaning
start cmd /k "cd CastraView && rm -rf dist/ && npm cache clean --force"
pause

echo [3]: Django Cache Cleaning
start cmd /k "python manage.py clear_cache"
pause

echo "Complete all stages"

