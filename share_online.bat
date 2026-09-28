@echo off
chcp 65001 >nul
title Chia se website ra Internet qua Cloudflare Tunnel
cls

echo ==================================================================
echo   DANG TAO DUONG LINK CONG KHAI QUA CLOUDFLARE TUNNEL
echo ==================================================================
echo.
echo Luu y: Hay dam bao he thong da duoc khoi dong (start_all.bat) truoc.
echo Dang ket noi mang Cloudflare...
echo.

"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:5173
