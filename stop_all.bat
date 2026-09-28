@echo off
chcp 65001 >nul
title Dung he thong Tuyen dung AI Recruitment
cls

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop_all.ps1"

echo.
echo Nhan phim bat ky de thoat...
pause >nul
