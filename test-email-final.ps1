Write-Host "`n🧪 Testing Email Service...`n" -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    Write-Host "Sending test request to Vercel backend..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "https://gt-vs-new-be-code.vercel.app/api/auth/send-otp-email" -Method POST -ContentType "application/json" -Body '{"email":"keepingupwiththejonezez@gmail.com"}' -ErrorAction Stop
    
    Write-Host "`n✅ SUCCESS! Email service is working!" -ForegroundColor Green
    Write-Host "───────────────────────────────────────" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor White
    Write-Host "Message: $($response.message)" -ForegroundColor White
    Write-Host "`n📧 Check your email inbox for the OTP!`n" -ForegroundColor Cyan
    
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    
    if ($errorDetails.message -like "*ECONNREFUSED*") {
        Write-Host "`n❌ Email service still not configured" -ForegroundColor Red
        Write-Host "Please verify you added all 4 environment variables to Vercel`n" -ForegroundColor Yellow
    } elseif ($errorDetails.message -like "*Authentication*" -or $errorDetails.message -like "*535*") {
        Write-Host "`n❌ Email authentication failed" -ForegroundColor Red
        Write-Host "Check your EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct`n" -ForegroundColor Yellow
    } else {
        Write-Host "`n⚠️ Error: $($errorDetails.message)" -ForegroundColor Yellow
        Write-Host "Full response:" -ForegroundColor Gray
        $errorDetails | ConvertTo-Json -Depth 3
    }
}

Write-Host "`nTo check Vercel deployment status:" -ForegroundColor Cyan
Write-Host "https://vercel.com/dashboard`n" -ForegroundColor Gray
