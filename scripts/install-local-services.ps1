$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$runtimePath = Join-Path $projectRoot '.qa/runtime'
New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
function Install-VerifiedArchive($Url, $ArchiveName, $ExpectedHash, $BinaryName) {
  $targetPath = Join-Path $runtimePath $BinaryName
  if (Test-Path -LiteralPath $targetPath) { Write-Output "$BinaryName already available; original download verification is recorded in the homologation report."; return }
  $archivePath = Join-Path $runtimePath $ArchiveName
  Invoke-WebRequest -Uri $Url -OutFile $archivePath
  $actualHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne $ExpectedHash.ToLowerInvariant()) { throw "Checksum mismatch: $ArchiveName" }
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    $entry = $zip.Entries | Where-Object { $_.Name -eq $BinaryName } | Select-Object -First 1
    if (-not $entry) { throw "Binary missing in official archive: $BinaryName" }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $targetPath, $false)
  } finally { $zip.Dispose() }
  Write-Output "$BinaryName downloaded and SHA-256 verified."
}
$mongoUrl = 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.34.zip'
$mongoHashText = (Invoke-WebRequest -Uri ($mongoUrl + '.sha256')).Content
if ($mongoHashText -is [byte[]]) { $mongoHashText = [Text.Encoding]::UTF8.GetString($mongoHashText) }
$mongoHash = [regex]::Match($mongoHashText, '[a-fA-F0-9]{64}').Value
if (-not $mongoHash) { throw 'Official MongoDB checksum unavailable' }
Install-VerifiedArchive $mongoUrl 'mongodb.zip' $mongoHash 'mongod.exe'
Install-VerifiedArchive 'https://github.com/axllent/mailpit/releases/download/v1.31.5/mailpit-windows-amd64.zip' 'mailpit.zip' '9637e21c02b33185fe69268ba05317152a5d8ac7877115e8a70e29b7e199e8dc' 'mailpit.exe'
Write-Output 'Local service binaries ready. Nothing was installed as a Windows service.'
