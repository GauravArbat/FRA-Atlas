@echo off
echo Fixing .env file for local development...

REM Replace postgres with localhost in .env file
powershell -Command "(Get-Content .env) -replace 'postgres:', 'localhost:' -replace 'redis:', 'localhost:' | Set-Content .env"

echo .env file updated for local development!
echo.
echo Database host changed from 'postgres' to 'localhost'
echo Redis host changed from 'redis' to 'localhost'
echo.
echo Make sure PostgreSQL is running on localhost:5432
echo Make sure Redis is running on localhost:6379 (optional)
echo.
pause
