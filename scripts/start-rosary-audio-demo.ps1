param([int]$Port = 3131)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$version = & node --version
if ($version -notmatch '^v22\.') {
    throw 'Este projeto exige Node 22. Ative essa versão antes de iniciar a demonstração.'
}
if ($Port -lt 1024 -or $Port -gt 65535) { throw 'Escolha uma porta entre 1024 e 65535.' }
# Process-local settings: no .env files, Vercel credentials or database required.
$env:NEXT_PUBLIC_ROSARY_AUDIO_DEMO = 'true'
$env:MONGODB_URI = ''
$env:EMAIL_DELIVERY_DISABLED = 'true'
$env:NEXT_PUBLIC_UPLOADS_ENABLED = 'false'
$env:NEXT_PUBLIC_REALTIME_ENABLED = 'false'
$env:PANTERALAB_AI_ENABLED = 'false'
# Webpack supports the shared dependency junction used in the review checkout.
& node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port $Port
