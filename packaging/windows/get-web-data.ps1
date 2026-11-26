# Downloads the dictionary data pinned in web-data.txt, checks its SHA-256 and unpacks it into web\data.
# -Tar <file>: use an already downloaded copy (the hash is still checked)
param([string]$Tar = "")
$ErrorActionPreference = "Stop"
$Repo = (Resolve-Path "$PSScriptRoot\..\..").Path
$Conf = @{}
Get-Content "$PSScriptRoot\web-data.txt" | Where-Object { $_ -match '^(url|sha256)=(.+)$' } | ForEach-Object { $Conf[$Matches[1]] = $Matches[2].Trim() }
if (-not $Conf.url -or -not $Conf.sha256) { throw "web-data.txt needs url= and sha256=" }
if (-not $Tar) {
    $Tar = Join-Path $env:TEMP "satni-fst-web-data.tar"
    Invoke-WebRequest -Uri $Conf.url -OutFile $Tar -UseBasicParsing
}
$Got = (Get-FileHash $Tar -Algorithm SHA256).Hash.ToLower()
if ($Got -ne $Conf.sha256.ToLower()) { throw "SHA-256 mismatch: expected $($Conf.sha256), got $Got" }
Remove-Item -Recurse -Force (Join-Path $Repo "web\data") -ErrorAction SilentlyContinue
tar -xf $Tar -C (Join-Path $Repo "web")
if ($LASTEXITCODE -ne 0) { throw "tar failed" }
Get-ChildItem (Join-Path $Repo "web\data") | Select-Object Name, Length | Format-Table -AutoSize
