# Builds the Windows version of the Qt desktop app (satni_desktop.py) into satni-fst-windows.zip.
# Used by GitHub Actions (.github/workflows/windows.yml) and can be run by hand on any Windows 10/11 PC with
# Python 3.12. The same steps as build_qt_exe.sh, which runs them over SSH on the maintainer's own build PC.
#
#   powershell -ExecutionPolicy Bypass -File packaging\windows\build.ps1 [-Python <python.exe>] [-Out <dir>]
#
# Needs in the repository folder: version.py (python bump_version.py) and web\data (the dictionary files,
# see packaging\windows\web-data.txt). PySide6 and PyInstaller versions are pinned below so that every
# build uses the same components.
param(
    [string]$Python = "python",
    [string]$Out = "build-windows"
)
$ErrorActionPreference = "Stop"
$Repo = (Resolve-Path "$PSScriptRoot\..\..").Path
$Out = [IO.Path]::GetFullPath((Join-Path $Repo $Out))
foreach ($f in @("satni_desktop.py", "tts.py", "version.py", "sami_icon.ico", "web\index.html", "web\data\satni-web.db.gz")) {
    if (-not (Test-Path (Join-Path $Repo $f))) { throw "Missing $f (version.py: python bump_version.py; web\data: packaging\windows\web-data.txt)" }
}

Remove-Item -Recurse -Force $Out -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $Out | Out-Null
$Src = Join-Path $Out "src"; $Work = Join-Path $Out "work"; $Dist = Join-Path $Out "dist"; $Venv = Join-Path $Out "venv"
New-Item -ItemType Directory -Force $Src | Out-Null
# Only the files the app needs, like build_qt_exe.sh
foreach ($f in @("satni_desktop.py", "tts.py", "version.py", "sami_icon.ico")) { Copy-Item (Join-Path $Repo $f) $Src }
Copy-Item -Recurse (Join-Path $Repo "web") (Join-Path $Src "web")

# Own Python environment with pinned build tools. Windows PowerShell treats a native program's stderr as an
# error, so pip and PyInstaller run through cmd with a log file and success is checked from the exit code.
& $Python -m venv $Venv
$Py = Join-Path $Venv "Scripts\python.exe"
cmd /c "`"$Py`" -m pip install --quiet --upgrade pip > `"$Out\pip.log`" 2>&1"
cmd /c "`"$Py`" -m pip install --quiet pyinstaller==6.22.3 PySide6==6.9.3 certifi==2024.8.30 >> `"$Out\pip.log`" 2>&1"
if ($LASTEXITCODE -ne 0) { Get-Content "$Out\pip.log" -Tail 20; throw "pip install failed" }

Push-Location $Src
try {
    $Pyi = Join-Path $Venv "Scripts\pyinstaller.exe"
    cmd /c "`"$Pyi`" --clean --noconfirm --windowed --onedir -n satni-fst --icon `"$Src\sami_icon.ico`" --add-data `"$Src\web;web`" --collect-data certifi --workpath `"$Work`" --distpath `"$Dist`" --specpath `"$Work`" satni_desktop.py > `"$Out\pyinstaller.log`" 2>&1"
    if ($LASTEXITCODE -ne 0) { Get-Content "$Out\pyinstaller.log" -Tail 30; throw "PyInstaller failed" }
} finally { Pop-Location }

# Licences: Python's licence (includes the bundled OpenSSL, libffi, zlib etc.) for About -> Licences
$BasePrefix = (& $Python -c "import sys; print(sys.base_prefix)").Trim()
$Lic = Join-Path $Dist "satni-fst\_internal\web\licenses\desktop"
New-Item -ItemType Directory -Force $Lic | Out-Null
Copy-Item (Join-Path $BasePrefix "LICENSE.txt") (Join-Path $Lic "python-LICENSE.txt")
Set-Content -Path (Join-Path $Lic "files.txt") -Value "python-LICENSE.txt" -Encoding ascii

$Zip = Join-Path $Out "satni-fst-windows.zip"
Compress-Archive -Path (Join-Path $Dist "satni-fst") -DestinationPath $Zip
if (-not (Test-Path $Zip)) { throw "Zip was not created" }
Get-Item $Zip | Select-Object FullName, Length | Format-List
