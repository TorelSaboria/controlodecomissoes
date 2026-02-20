# Simple HTTP Server for HotelCom
# Run: powershell -ExecutionPolicy Bypass -File serve.ps1

$port = 3000
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  HotelCom Dev Server" -ForegroundColor Green
Write-Host "  -------------------" -ForegroundColor DarkGray
Write-Host "  Local: http://localhost:$port/" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host ""

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq '/') { $urlPath = '/index.html' }

        $filePath = Join-Path $root ($urlPath -replace '/', '\')

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) { $contentType = 'application/octet-stream' }

            $response.ContentType = $contentType
            $response.StatusCode = 200

            # Add CORS headers for ES modules
            $response.Headers.Add("Access-Control-Allow-Origin", "*")

            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            # SPA fallback to index.html
            $indexPath = Join-Path $root 'index.html'
            if (Test-Path $indexPath) {
                $response.ContentType = 'text/html; charset=utf-8'
                $response.StatusCode = 200
                $content = [System.IO.File]::ReadAllBytes($indexPath)
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $msg.Length
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        }

        $response.Close()

        $status = $response.StatusCode
        Write-Host "  $($request.HttpMethod) $urlPath -> $status" -ForegroundColor $(if ($status -eq 200) { 'DarkGray' } else { 'Yellow' })
    }
} finally {
    $listener.Stop()
    Write-Host "`n  Server stopped." -ForegroundColor Yellow
}
