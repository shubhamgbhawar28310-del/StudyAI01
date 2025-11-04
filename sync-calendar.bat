@echo off
echo.
echo ========================================
echo   Syncing to Google Calendar
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0sync-calendar.ps1"

echo.
pause
