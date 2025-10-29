@echo off
echo Compressing demo-video.mp4...
echo This will create demo-video-compressed.mp4

REM Check if FFmpeg is installed
where ffmpeg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: FFmpeg is not installed or not in PATH
    echo Please install FFmpeg from: https://ffmpeg.org/download.html
    pause
    exit /b 1
)

REM Compress video with good quality/size balance
ffmpeg -i public\demo-video.mp4 -vcodec h264 -crf 28 -preset medium -vf scale=1920:-2 -acodec aac -b:a 128k public\demo-video-compressed.mp4

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Compression complete!
    echo Original file: public\demo-video.mp4
    echo Compressed file: public\demo-video-compressed.mp4
    echo.
    echo Check the compressed file. If quality is good:
    echo 1. Delete public\demo-video.mp4
    echo 2. Rename public\demo-video-compressed.mp4 to demo-video.mp4
) else (
    echo.
    echo ERROR: Compression failed
)

pause
