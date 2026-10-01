@echo off
chcp 65001 >nul
title Nap du lieu AI Recruitment
cd /d "%~dp0"
echo ==================================================================
echo   NAP DU LIEU tu file .zip (keo tha file .zip vao file nay, hoac de
echo   file .zip trong thu muc data_transfer\)
echo ==================================================================
echo.
if not exist "backend\.env" (
    echo [LOI] Chua co file backend\.env. Hay tao file nay ^(xem backend\.env.example^) roi chay lai.
    goto :end
)
set "PY=python"
if exist "backend\venv\Scripts\python.exe" set "PY=backend\venv\Scripts\python.exe"
if exist "backend\.venv\Scripts\python.exe" set "PY=backend\.venv\Scripts\python.exe"
"%PY%" scripts\transfer_data.py import %*
:end
echo.
echo Nhan phim bat ky de dong cua so...
pause >nul
