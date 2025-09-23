@echo off
title FRA Atlas - Make All Functions Work

echo.
echo 🌳 FRA Atlas - Make All Functions Work
echo ======================================
echo.
echo This will fix and start all FRA Atlas functions automatically.
echo Please wait while we set everything up...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo.
    echo Please install Node.js 18+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the FRA project root directory
    echo.
    pause
    exit /b 1
)

echo 🚀 Starting FRA Atlas setup and launch...
echo.

REM Run the master script
node make-all-functions-work.js

echo.
echo Press any key to exit...
pause >nul