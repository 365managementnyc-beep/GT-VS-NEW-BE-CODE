Write-Host "`nTESTING AFTER JWT_EXPIRES_IN FIX" -ForegroundColor Cyan
Write-Host "===================================`n" -ForegroundColor Cyan

Write-Host "Checking if Vercel has redeployed..." -ForegroundColor Yellow
Write-Host "Deployment status: https://vercel.com/dashboard`n" -ForegroundColor Gray

Write-Host "Press Enter when deployment shows 'Ready'..." -ForegroundColor Yellow
$null = Read-Host

Write-Host "`nTesting OTP Email Service...`n" -ForegroundColor Cyan

$emailBody = '{"email":"keepingupwiththejonezez@gmail.com"}'

Write-Host "Sending OTP request to backend..." -ForegroundColor Gray

try {
    $result = Invoke-RestMethod -Uri "https://gt-vs-new-be-code.vercel.app/api/auth/send-otp-email" -Method POST -ContentType "application/json" -Body $emailBody -ErrorAction Stop
    
    Write-Host "SUCCESS! OTP email sent`n" -ForegroundColor Green
    Write-Host "Response: $($result.message)" -ForegroundColor White
    
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Check email inbox for OTP code" -ForegroundColor Gray
    Write-Host "  2. Try completing signup/login with OTP" -ForegroundColor Gray
    Write-Host "  3. Should work without 'expiresIn' error`n" -ForegroundColor Gray
    
} catch {
    Write-Host "FAILED`n" -ForegroundColor Red
    
    try {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorMessage = $errorDetails.message
    } catch {
        $errorMessage = $_.Exception.Message
    }
    
    Write-Host "Error: $errorMessage`n" -ForegroundColor Red
    
    if ($errorMessage -match "expiresIn") {
        Write-Host "JWT_EXPIRES_IN still needs to be fixed!" -ForegroundColor Yellow
        Write-Host "`nAction required:" -ForegroundColor Yellow
        Write-Host "  1. Vercel -> GT-VS-NEW-BE-CODE -> Settings" -ForegroundColor Gray
        Write-Host "  2. Environment Variables" -ForegroundColor Gray
        Write-Host "  3. Set JWT_EXPIRES_IN = 90d" -ForegroundColor Green
        Write-Host "  4. Save and wait for redeploy`n" -ForegroundColor Gray
    }
}

Write-Host "===================================`n" -ForegroundColor Cyan
