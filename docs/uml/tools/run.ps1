param([string]$Script, [string]$Out, [string]$Base, [int]$TimeoutSec = 150)
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
$env:AIGEN_SCRIPT = $Script
$env:AIGEN_OUT = $Out
$dir = Split-Path $Script
$log = Join-Path $dir "run.log"
$p = Start-Process -FilePath "C:\Program Files\StarUML\StarUML.exe" -ArgumentList @("exec", "`"$Base`"", "-c", "aigen:build") -RedirectStandardOutput $log -RedirectStandardError "$log.err" -PassThru -WindowStyle Hidden
if (-not $p.WaitForExit($TimeoutSec * 1000)) {
  "TIMEOUT - killing"
  Get-Process StarUML -ErrorAction SilentlyContinue | Stop-Process -Force
}
Start-Sleep -Milliseconds 500
Get-Content $log | Where-Object { $_ -match "aigen|rror" } | Select-Object -Last 60
"exists: " + (Test-Path $Out)
