@echo off
title AetherCatalog - Multimodal AI Asset Cataloguer
echo =============================================================
echo               A E T H E R   C A T A L O G
echo        Multimodal AI Asset Cataloguing System Launcher
echo =============================================================
echo.
echo [1/3] Ensuring required python packages are installed...
python -m pip install flask pymongo --quiet
echo.
echo [2/3] Spinning up Python backend server with MongoDB...
echo [3/3] Launching AetherCatalog inside your default web browser...
echo.
echo Server running at: http://localhost:8000
echo.
echo Press Ctrl+C in this command window to terminate the server.
echo =============================================================

:: Open browser in background
start http://localhost:8000

:: Start Flask MongoDB server
python server.py
