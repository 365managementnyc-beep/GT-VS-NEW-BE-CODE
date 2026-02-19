Write-Host "`n📋 AFTER YOU UPDATE JWT_EXPIRES_IN TO '90d':" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Waiting for Vercel to redeploy..." -ForegroundColor Yellow
Write-Host "Check deployment status: https://vercel.com/dashboard`n" -ForegroundColor Gray

Write-Host "Press Enter when deployment is complete..." -ForegroundColor Yellow
$null = Read-Host

Write-Host "`n🧪 Testing OTP Verification...`n" -ForegroundColor Cyan

# Get new OTP
Write-Host "Step 1: Requesting new OTP code..." -ForegroundColor Yellow
$emailBody = '{"email":"test-user@example.com"}'

try {
    $otpResponse = Invoke-RestMethod -Uri "https://gt-vs-new-be-code.vercel.app/api/auth/send-otp-email" -Method POST -ContentType "application/json" -Body $emailBody -ErrorAction Stop
    
    Write-Host "✅ OTP email sent successfully!`n" -ForegroundColor Green
    Write-Host "What to do next:" -ForegroundColor Yellow
    Write-Host "  1. Check your test email inbox" -ForegroundColor Gray
    Write-Host "  2. Copy the 6-digit OTP code" -ForegroundColor Gray
    Write-Host "  3. Try completing signup again`n" -ForegroundColor Gray
    
    Write-Host "Expected result:" -ForegroundColor Cyan
    Write-Host "  ✓ OTP verification should succeed" -ForegroundColor Green
    Write-Host "  ✓ No more 'expiresIn' error" -ForegroundColor Green
    Write-Host "  ✓ Account created successfully`n" -ForegroundColor Green
    
} catch {
    $errorMsg = ""
    if ($_.ErrorDetails.Message) {
        try {
            $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorMsg = $errorObj.message
        } catch {
            $errorMsg = $_.ErrorDetails.Message
        }
    } else {
        $errorMsg = $_.Exception.Message
    }
    
    Write-Host "❌ Error: $errorMsg`n" -ForegroundColor Red
    
    if ($errorMsg -like "*expiresIn*") {
        Write-Host "⚠️ JWT_EXPIRES_IN still has invalid format" -ForegroundColor Yellow
        Write-Host "   Make sure you set it to exactly: 90d" -ForegroundColor Gray
        Write-Host "   Then wait for Vercel to finish redeploying`n" -ForegroundColor Gray
    } elseif ($errorMsg -like "*ECONNREFUSED*") {
        Write-Host "⚠️ Email service issue - check EMAIL_HOST configuration`n" -ForegroundColor Yellow
    }
}

Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "For admin login after fix:" -ForegroundColor Yellow
Write-Host "  Email: keepingupwiththejonezez@gmail.com" -ForegroundColor White
Write-Host "  Password: Adminaszx12345`n" -ForegroundColor White
