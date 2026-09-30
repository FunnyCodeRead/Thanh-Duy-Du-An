param([string]$Mdj, [string]$OutDir, [string]$Format = "png")
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $OutDir | Out-Null
$out = & "C:\Program Files\StarUML\StarUML.exe" image $Mdj -f $Format -o "$OutDir\<%=filenamify(element.name)%>.$Format" 2>&1 | Out-String
($out -split "`n" | Where-Object { $_ -match "Total|rror" }) -join "`n"
