@echo off
echo ============================================
echo Video Replacement Helper
echo ============================================
echo.
echo This script will help you replace the old video with the compressed one.
echo.
echo INSTRUCTIONS:
echo 1. Make sure you've downloaded the compressed video
echo 2. The compressed video should be in your Downloads folder
echo 3. Press any key to continue...
pause >nul

echo.
echo Opening the public folder...
start explorer "%~dp0public"

echo.
echo Opening your Downloads folder...
start explorer "%USERPROFILE%\Downloads"

echo.
echo ============================================
echo MANUAL STEPS:
echo ============================================
echo 1. In the Downloads folder, find your compressed video
echo 2. Copy it (Ctrl+C)
echo 3. In the public folder, DELETE the old demo-video.mp4
echo 4. Paste the compressed video (Ctrl+V)
echo 5. Rename it to: demo-video.mp4
echo ============================================
echo.
pause
