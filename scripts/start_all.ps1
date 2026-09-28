# scripts/start_all.ps1
# Script khoi dong toan bo he thong: MySQL -> Database -> Backend -> Frontend -> Browser

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) {
    $rootDir = Get-Location
}

function Test-PortOpen {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        return $true
    }
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne(500, $false) -and $client.Connected) {
            $client.EndConnect($iar)
            $client.Close()
            return $true
        }
        $client.Close()
    } catch {}
    try {
        $client6 = New-Object System.Net.Sockets.TcpClient([System.Net.Sockets.AddressFamily]::InterNetworkV6)
        $iar6 = $client6.BeginConnect("::1", $Port, $null, $null)
        if ($iar6.AsyncWaitHandle.WaitOne(500, $false) -and $client6.Connected) {
            $client6.EndConnect($iar6)
            $client6.Close()
            return $true
        }
        $client6.Close()
    } catch {}
    return $false
}

Clear-Host
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "       KHOI DONG HE THONG TUYEN DUNG AI RECRUITMENT              " -ForegroundColor Yellow -NoNewline
Write-Host " (All-in-One)" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------
# 1. KIEM TRA VA KHOI DONG MYSQL (Port 3306)
# ------------------------------------------------------------------
Write-Host "[1/4] Kiem tra dich vu MySQL (Port 3306)..." -ForegroundColor White
$mysqlReady = Test-PortOpen -Port 3306

if ($mysqlReady) {
    Write-Host "  -> MySQL dang chay san sang tren port 3306." -ForegroundColor Green
} else {
    Write-Host "  -> MySQL chua chay. Dang tien hanh khoi dong MySQL..." -ForegroundColor Yellow
    $startMysqlScript = Join-Path $PSScriptRoot "start_mysql.ps1"
    
    if (Test-Path $startMysqlScript) {
        try {
            & powershell -ExecutionPolicy Bypass -File $startMysqlScript
        } catch {
            Write-Host "  -> Khong the khoi dong tu start_mysql.ps1: $_" -ForegroundColor Red
        }
    }

    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Milliseconds 600
        if (Test-PortOpen -Port 3306) {
            $mysqlReady = $true
            break
        }
    }

    if ($mysqlReady) {
        Write-Host "  -> MySQL da khoi dong thanh cong tren port 3306." -ForegroundColor Green
    } else {
        Write-Host "  [CANH BAO] Khong the ket noi MySQL tren port 3306." -ForegroundColor Red
        Write-Host "  Vui long dam bao MySQL Server (hoac XAMPP/Laragon) dang bat." -ForegroundColor Yellow
    }
}

Write-Host ""

# ------------------------------------------------------------------
# 2. KIEM TRA & KHOI TAO CSDL (ai_recruitment + Demo Users)
# ------------------------------------------------------------------
Write-Host "[2/4] Kiem tra & Khoi tao Co so du lieu (ai_recruitment)..." -ForegroundColor White
$initDbScript = Join-Path $PSScriptRoot "init_db.py"

if ($mysqlReady -and (Test-Path $initDbScript)) {
    try {
        $initResult = & python $initDbScript 2>&1
        Write-Host "  -> Co so du lieu va tai khoan demo da san sang." -ForegroundColor Green
    } catch {
        Write-Host "  -> Canh bao khi kiem tra CSDL: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  -> Bo qua buoc khoi tao do MySQL chua san sang." -ForegroundColor Yellow
}

Write-Host ""

# ------------------------------------------------------------------
# 3. KHOI DONG BACKEND FLASK (Port 5000)
# ------------------------------------------------------------------
Write-Host "[3/4] Kiem tra Backend Flask (Port 5000)..." -ForegroundColor White
$backendReady = Test-PortOpen -Port 5000

if ($backendReady) {
    Write-Host "  -> Backend Flask dang chay san tren http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "  -> Dang khoi dong Backend Flask server tren port 5000..." -ForegroundColor Yellow
    $backendCmd = "title Backend Flask :5000 && cd /d `"$rootDir`" && python backend/app.py"
    Start-Process cmd.exe -ArgumentList "/k", $backendCmd -WindowStyle Normal

    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-PortOpen -Port 5000) {
            $backendReady = $true
            break
        }
    }

    if ($backendReady) {
        Write-Host "  -> Backend Flask da khoi dong thanh cong tai http://localhost:5000" -ForegroundColor Green
    } else {
        Write-Host "  [CANH BAO] Backend dang khoi dong (co the can them vai giay)." -ForegroundColor Yellow
    }
}

Write-Host ""

# ------------------------------------------------------------------
# 4. KHOI DONG FRONTEND VITE (Port 5173)
# ------------------------------------------------------------------
Write-Host "[4/4] Kiem tra Frontend Vite (Port 5173)..." -ForegroundColor White
$frontendReady = Test-PortOpen -Port 5173

if ($frontendReady) {
    Write-Host "  -> Frontend Vite dang chay san tren http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "  -> Dang khoi dong Frontend Vite dev server tren port 5173..." -ForegroundColor Yellow
    $frontendDir = Join-Path $rootDir "frontend"
    $frontendCmd = "title Frontend Vite :5173 && cd /d `"$frontendDir`" && npm run dev"
    Start-Process cmd.exe -ArgumentList "/k", $frontendCmd -WindowStyle Normal

    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-PortOpen -Port 5173) {
            $frontendReady = $true
            break
        }
    }

    if ($frontendReady) {
        Write-Host "  -> Frontend Vite da khoi dong thanh cong tai http://localhost:5173" -ForegroundColor Green
    } else {
        Write-Host "  [CANH BAO] Frontend dang khoi dong (co the can them vai giay)." -ForegroundColor Yellow
    }
}

Write-Host ""

# ------------------------------------------------------------------
# 5. MO TRINH DUYET VA HIEN THI THONG TIN
# ------------------------------------------------------------------
Start-Sleep -Seconds 1
Write-Host "Dang mo trinh duyet den http://localhost:5173..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "       HE THONG DA KHOI DONG THANH CONG VA SAN SANG SU DUNG!      " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  * Giao dien Web (Frontend) : " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "  * API Backend (Flask)      : " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host "  * Co so du lieu (MySQL)    : " -NoNewline -ForegroundColor White
Write-Host "127.0.0.1:3306 [ai_recruitment]" -ForegroundColor Cyan
Write-Host ""
Write-Host "  --- TAI KHOAN DANG NHAP HE THONG (Mat khau chung: 123456) ---" -ForegroundColor Yellow
Write-Host "  1. Quan tri vien (Admin)   : admin@example.com" -ForegroundColor White
Write-Host "  2. Nhan vien HR (HR)       : hr@example.com" -ForegroundColor White
Write-Host "  3. Quan ly tuyen dung (Mgr): manager@example.com" -ForegroundColor White
Write-Host ""
Write-Host "  * De tat toan bo he thong sau khi su dung, hay chay: " -NoNewline -ForegroundColor Gray
Write-Host "stop_all.bat" -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
