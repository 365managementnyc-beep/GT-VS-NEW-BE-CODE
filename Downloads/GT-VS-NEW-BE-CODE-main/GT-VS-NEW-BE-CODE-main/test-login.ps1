$body = @{
    email = "admin12345@gmail.com"
    password = "Adminaszx12345"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "Testing login endpoint..." -ForegroundColor Yellow
Write-Host "URL: https://gt-vs-new-be-code.vercel.app/api/auth/login" -ForegroundColor Cyan
Write-Host  ""

try {
    $response = Invoke-WebRequest -Uri "https://gt-vs-new-be-code.vercel.app/api/auth/login" -Method POST -Body $body -Headers $headers -UseBasicParsing
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

