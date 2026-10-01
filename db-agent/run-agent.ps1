param([switch]$Check)
# Runs the AI Business Platform DB Agent against the local ai_recruitment database.
# Secrets (read-only DB URL, agent token) come from agent.env.local (git-ignored) and are never printed.
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$platformRepo = if ($env:ABP_PLATFORM_REPO) { $env:ABP_PLATFORM_REPO } else { 'C:\AI Business Platform' }
$envFile = Join-Path $here 'agent.env.local'
if (-not (Test-Path -LiteralPath $envFile)) { throw "Missing $envFile (ABP_AGENT_DATABASE_URL and ABP_AGENT_TOKEN)" }
foreach ($line in Get-Content -LiteralPath $envFile) {
  if ($line -match '^(ABP_AGENT_[A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process') }
}
# The local development platform is served over plain HTTP; a production platform URL must be HTTPS.
$config = Get-Content -LiteralPath (Join-Path $here 'agent.config.json') -Raw | ConvertFrom-Json
if ($config.platformUrl -like 'http://localhost*' -or $config.platformUrl -like 'http://127.0.0.1*') { $env:ABP_AGENT_ALLOW_HTTP = 'true' }
$arguments = @('tsx', (Join-Path $platformRepo 'packages\db-agent\src\cli.ts'), '--config', (Join-Path $here 'agent.config.json'))
if ($Check) { $arguments += '--check' }
Push-Location $platformRepo
try { & npx.cmd @arguments; exit $LASTEXITCODE } finally { Pop-Location }
