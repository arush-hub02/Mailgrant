@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run this launcher.
  pause
  exit /b 1
)
node "%~dp0scripts\local-server.mjs" stop
set "MAILGRANT_EXIT=%ERRORLEVEL%"
if not "%MAILGRANT_EXIT%"=="0" if "%~1"=="" pause
exit /b %MAILGRANT_EXIT%
