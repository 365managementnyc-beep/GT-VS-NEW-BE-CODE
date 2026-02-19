Write-Host "`n📋 QUICK EMAIL SETUP CHECKLIST" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Step 1: Gmail App Password" -ForegroundColor Yellow
Write-Host "  1. Go to: https://myaccount.google.com/apppasswords" -ForegroundColor Gray
Write-Host "  2. Generate App Password for 'Mail'" -ForegroundColor Gray
Write-Host "  3. Copy the 16-character password`n" -ForegroundColor Gray

Write-Host "Step 2: Add to Vercel (https://vercel.com)" -ForegroundColor Yellow
Write-Host "  Project: GT-VS-NEW-BE-CODE → Settings → Environment Variables`n" -ForegroundColor Gray

Write-Host "Add these 4 variables:" -ForegroundColor White
Write-Host "  EMAIL_HOST=smtp.gmail.com" -ForegroundColor Green
Write-Host "  EMAIL_HOST_USER=your-gmail@gmail.com" -ForegroundColor Green
Write-Host "  EMAIL_HOST_PASSWORD=<your-app-password>" -ForegroundColor Green
Write-Host "  EMAIL_FROM_CONFIG=Gala Tab <your-gmail@gmail.com>`n" -ForegroundColor Green

Write-Host "Step 3: Test After Deploy" -ForegroundColor Yellow
Write-Host "  Run: node test-email-on-vercel.js`n" -ForegroundColor Gray

Write-Host "Expected: Status 200 + 'OTP sent to email'" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Press Enter when you've added the variables to Vercel..." -ForegroundColor Yellow
$null = Read-Host
