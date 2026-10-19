param([ValidateSet('menu','start','backup','restore','check')][string]$Action = 'menu')
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$portableNode = Join-Path $PWD '.tools\node-v24.22.0-win-x64\node.exe'
if (Test-Path $portableNode) { $node = $portableNode; $env:PATH = "$(Split-Path $node);$env:PATH" }
else { $node = (Get-Command node -ErrorAction SilentlyContinue).Source }
if (!$node) { throw 'Node.js is missing. Install Node 24, then reopen this launcher. See docs/LOCAL_SETUP.md.' }
& $node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if ($LASTEXITCODE) { throw 'This launcher requires Node.js 24 or newer.' }
if (!(Test-Path 'node_modules\vinext')) { throw 'Dependencies are missing. Run pnpm.cmd install --frozen-lockfile first. See docs/LOCAL_SETUP.md.' }
function Invoke-Node([string[]]$Arguments) { & $node @Arguments; if ($LASTEXITCODE) { throw "Command failed (exit $LASTEXITCODE)." } }
if ($Action -eq 'menu') {
 Write-Host 'Policy Atlas - local Windows tools'
 Write-Host '1 Start app   2 Back up local data   3 Restore local data   4 Check setup'
 switch (Read-Host 'Choose 1-4') { '1' {$Action='start'} '2' {$Action='backup'} '3' {$Action='restore'} '4' {$Action='check'} default {throw 'Choose 1-4.'} }
}
switch ($Action) {
 'check' { Invoke-Node -Arguments @('--version'); Write-Host 'Node and installed dependencies found. This does not verify build or database health.' }
 'start' {
  if (!(Test-Path 'dist\server\wrangler.json')) {
   Invoke-Node -Arguments @('scripts/prepare-parsers.mjs'); Invoke-Node -Arguments @('scripts/prepare-semantic.mjs'); Invoke-Node -Arguments @('scripts/run-framework.mjs','build')
  }
  Invoke-Node -Arguments @('scripts/local-db.mjs')
  Write-Host 'Open http://localhost:5173/signin-with-chatgpt?return_to=/ . Keep this terminal open; Ctrl+C stops the server.'
  Invoke-Node -Arguments @('scripts/run-framework.mjs','dev')
 }
 {$_ -in 'backup','restore'} {
  Write-Host 'Stop ALL Policy Atlas dev/preview servers, including custom ports, before continuing.'
  if ((Read-Host 'Type STOPPED to confirm') -cne 'STOPPED') { throw 'Cancelled.' }
  if ($Action -eq 'backup') {
   New-Item -ItemType Directory -Force 'exports' | Out-Null
   $folder = Join-Path $PWD ('exports\local-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  } else { $folder = Read-Host 'Full path to backup folder (contains backup.json)' }
  Invoke-Node -Arguments @('scripts/local-backup.mjs',$Action,$folder,'--stopped')
  Write-Host 'Completed. Backups contain private documents and notes; keep them private.'
 }
}

