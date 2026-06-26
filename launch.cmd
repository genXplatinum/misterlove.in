@echo off
REM One-click local dev server for the Lovepreet Singh portfolio.
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
echo Starting dev server...
call npm run dev -- --open
