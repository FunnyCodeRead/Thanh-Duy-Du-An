@echo off
chcp 65001 >nul
title Tao co so du lieu AI Recruitment
cd /d "%~dp0"

echo ==================================================================
echo   TAO CO SO DU LIEU: sql\schema.sql + sql\sample_data.sql
echo ==================================================================
echo.

if not exist "backend\.env" (
    echo [LOI] Chua co file backend\.env. Hay tao file nay ^(xem backend\.env.example^) roi chay lai.
    goto :end
)

set "PY=python"
if exist "backend\venv\Scripts\python.exe" set "PY=backend\venv\Scripts\python.exe"
if exist "backend\.venv\Scripts\python.exe" set "PY=backend\.venv\Scripts\python.exe"

"%PY%" scripts\setup_db.py %*

:end
echo.
echo Nhan phim bat ky de dong cua so...
pause >nul
