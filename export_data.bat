@echo off
chcp 65001 >nul
title Xuat du lieu AI Recruitment
cd /d "%~dp0"
echo ==================================================================
echo   XUAT DU LIEU: database + file CV + chi muc chatbot -^> data_transfer\*.zip
echo ==================================================================
echo.
if not exist "backend\.env" (
    echo [LOI] Chua co file backend\.env.
    goto :end
)
set "PY=python"
if exist "backend\venv\Scripts\python.exe" set "PY=backend\venv\Scripts\python.exe"
if exist "backend\.venv\Scripts\python.exe" set "PY=backend\.venv\Scripts\python.exe"
"%PY%" scripts\transfer_data.py export
:end
echo.
echo Nhan phim bat ky de dong cua so...
pause >nul
