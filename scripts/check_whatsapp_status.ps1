<#
.SYNOPSIS
  Consulta el estado de un mensaje enviado por la WhatsApp Cloud API usando el message id (wamid...).

.DESCRIPTION
  El script intenta leer WHATSAPP_TOKEN desde el archivo .env.local en la raíz del proyecto
  (o desde el mismo directorio si se ejecuta ahí). También acepta un parámetro -Token
  para pasar el token explícitamente sin modificar archivos.

.EXAMPLE
  ./scripts/check_whatsapp_status.ps1 -MsgId wamid.HBg... 

.EXAMPLE (pasando token directamente)
  ./scripts/check_whatsapp_status.ps1 -MsgId wamid.HBg... -Token "EAAX..."

#>

Param(
    [Parameter(Mandatory=$true)][string]$MsgId,
    [Parameter(Mandatory=$false)][string]$Token
)

function Get-EnvTokenFromFile([string]$envPath) {
    if (-not (Test-Path $envPath)) { return $null }
    $raw = Get-Content $envPath -Raw
    foreach ($line in ($raw -split "`r?`n")) {
        if ($line -match '^[\s#]*WHATSAPP_TOKEN\s*=\s*(.+)') {
            $val = $matches[1].Trim()
            # Remove surrounding quotes if any
            if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Trim('"') }
            if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Trim("'") }
            return $val
        }
    }
    return $null
}

# Locate .env.local: prefer workspace root relative to script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$rootCandidate = Resolve-Path (Join-Path $scriptDir "..") -ErrorAction SilentlyContinue
if ($rootCandidate) { $envPath = Join-Path $rootCandidate.Path ".env.local" } else { $envPath = ".env.local" }

if (-not $Token) {
    $Token = Get-EnvTokenFromFile $envPath
}

if (-not $Token) {
    Write-Error "WHATSAPP_TOKEN not found. Either add it to $envPath or pass -Token '<token>' to the script."
    exit 2
}

 # Build URI with explicit braced variables to avoid interpolation ambiguity
 $escapedMsgId = [System.Uri]::EscapeDataString($MsgId)
 $escapedToken = [System.Uri]::EscapeDataString($Token)
 $uri = "https://graph.facebook.com/v16.0/${escapedMsgId}?access_token=${escapedToken}"

# Debug output (token redacted): show MsgId and token length so we can diagnose malformed variables
Write-Host "Debug: MsgId = $MsgId"
if ($Token) { Write-Host "Debug: WHATSAPP_TOKEN length = $($Token.Length) (token redacted)" }
else { Write-Host "Debug: WHATSAPP_TOKEN not set" }
# Show redacted URI for diagnostics
$debugUri = "https://graph.facebook.com/v16.0/${escapedMsgId}?access_token=<redacted>"
Write-Host "Debug: Querying $debugUri"

try {
    $res = Invoke-RestMethod -Uri $uri -Method Get -ErrorAction Stop
    $json = $res | ConvertTo-Json -Depth 10
    Write-Output $json
} catch {
    Write-Error "Request failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        try { $body = $_.Exception.Response.GetResponseStream(); $sr = New-Object System.IO.StreamReader($body); $txt = $sr.ReadToEnd(); Write-Output $txt } catch {}
    }
    exit 1
}
