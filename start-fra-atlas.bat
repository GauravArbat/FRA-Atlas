@echo off
echo 🌳 FRA Atlas - Complete System Startup
echo =====================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo 📥 Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the FRA project root directory
    pause
    exit /b 1
)

echo 🚀 Starting FRA Atlas...
node start-all-services.js

pause