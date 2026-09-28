# scripts/stop_all.ps1
# Script dung cac tien trinh Frontend (port 5173) va Backend (port 5000)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    Write-Host "Dang kiem tra port $Port ($ServiceName)..." -ForegroundColor White
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  -> Dang tat $ServiceName (PID: $procId - $($proc.ProcessName))..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    Write-Host "  -> Da tat thanh cong $ServiceName (PID: $procId)." -ForegroundColor Green
                }
            } catch {
                Write-Host "  -> Khong the tat PID $procId : $_" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  -> Port $Port ($ServiceName) hien khong co tien trinh nao chay." -ForegroundColor Gray
    }
}

Clear-Host
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "       DUNG HE THONG TUYEN DUNG AI RECRUITMENT                   " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

Stop-ProcessOnPort -Port 5000 -ServiceName "Backend Flask"
Stop-ProcessOnPort -Port 5173 -ServiceName "Frontend Vite"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  Da dung xong cac tien trinh Frontend va Backend!" -ForegroundColor Green
Write-Host "  Luu y: MySQL van giu nguyen de dam bao an toan du lieu." -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""
