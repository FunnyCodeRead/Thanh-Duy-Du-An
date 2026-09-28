@echo off
chcp 65001 >nul
title Khoi dong he thong Tuyen dung AI Recruitment
cls

echo ==================================================================
echo   DANG KHOI DONG HE THONG TUYEN DUNG (MYSQL + BACKEND + FRONTEND)
echo ==================================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_all.ps1"

echo.
echo Nhan phim bat ky de dong cua so trinh khoi dong nay...
pause >nul
