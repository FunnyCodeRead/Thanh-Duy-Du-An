$serverRoot = 'C:\Program Files\MySQL\MySQL Server 8.4'
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'MySQL\Server 8.4'
$dataRoot = Join-Path $runtimeRoot 'Data'
$mysqld = Join-Path $serverRoot 'bin\mysqld.exe'
$logPath = Join-Path $runtimeRoot 'mysql-runtime.err'
$pidPath = Join-Path $runtimeRoot 'mysql.pid'

if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) {
    Write-Output 'MySQL is already running on 127.0.0.1:3306.'
    exit 0
}

if (-not (Test-Path -LiteralPath $mysqld)) {
    throw "MySQL Server executable was not found: $mysqld"
}

if (-not (Test-Path -LiteralPath $dataRoot)) {
    throw "MySQL data directory was not found: $dataRoot"
}

$argumentLine = '--basedir="{0}" --datadir="{1}" --port=3306 --bind-address=127.0.0.1 --mysqlx=0 --log-error="{2}" --pid-file="{3}"' -f $serverRoot, $dataRoot, $logPath, $pidPath
Start-Process -FilePath $mysqld -ArgumentList $argumentLine -WindowStyle Hidden | Out-Null

for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) {
        Write-Output 'MySQL started on 127.0.0.1:3306.'
        exit 0
    }
}

throw "MySQL did not start. Check the log: $logPath"

