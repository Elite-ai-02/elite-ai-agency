@echo off
title Elite AI Agency Platform
cd /d "%~dp0"
echo =======================================================
echo   Elite AI Agency Portal (Port 3000)
echo =======================================================
echo Starting server...
node local-server.js
pause
