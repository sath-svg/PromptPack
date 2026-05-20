# Zips each Loops MJML template into <name>.zip containing index.mjml.
# Loops requires this exact format for custom email upload.
#
# Run from repo root or web/ — uses script-relative paths.
#   pwsh web/scripts/zip-loops-emails.ps1
# Or via npm script:
#   cd web && npm run zip:loops

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceDir = Join-Path $ScriptDir '..\lib\loops-emails'
$OutDir    = Join-Path $SourceDir 'dist'

if (-not (Test-Path $SourceDir)) {
  throw "Source dir not found: $SourceDir"
}

if (-not (Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$Templates = Get-ChildItem -Path $SourceDir -Filter '*.mjml' -File

if ($Templates.Count -eq 0) {
  throw "No .mjml files found in $SourceDir"
}

$Staging = Join-Path $env:TEMP "loops-zip-$(Get-Random)"
New-Item -ItemType Directory -Path $Staging | Out-Null

try {
  foreach ($Template in $Templates) {
    $Name = [System.IO.Path]::GetFileNameWithoutExtension($Template.Name)
    $StagedFile = Join-Path $Staging 'index.mjml'
    $ZipPath = Join-Path $OutDir "$Name.zip"

    Copy-Item -Path $Template.FullName -Destination $StagedFile -Force
    if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
    Compress-Archive -Path $StagedFile -DestinationPath $ZipPath -Force
    Remove-Item $StagedFile -Force

    Write-Host "  $Name.mjml -> $($ZipPath -replace [regex]::Escape($SourceDir), 'loops-emails')"
  }

  Write-Host ""
  Write-Host "Done. Upload these ZIPs in Loops dashboard:" -ForegroundColor Green
  Get-ChildItem -Path $OutDir -Filter '*.zip' | ForEach-Object { Write-Host "  $($_.FullName)" }
} finally {
  if (Test-Path $Staging) { Remove-Item -Recurse -Force $Staging }
}
