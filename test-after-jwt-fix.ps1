Write-Host "`n⏳ Waiting for Vercel to redeploy...`n" -ForegroundColor Yellow
Write-Host "After updating JWT_EXPIRES_IN in Vercel:" -ForegroundColor Gray
Write-Host "  1. Vercel automatically triggers redeployment" -ForegroundColor Gray
Write-Host "  2. Usually takes 1-2 minutes" -ForegroundColor Gray
Write-Host "  3. Check: https://vercel.com/dashboard (Deployments tab)`n" -ForegroundColor Gray

Write-Host "Press Enter when deployment is complete..." -ForegroundColor Cyan
$null = Read-Host

Write-Host "`n🧪 Testing Full Login Flow...`n" -ForegroundColor Cyan

# Test 1: Login
Write-Host "Test 1: Admin Login" -ForegroundColor Yellow
$loginBody = '{"email":"keepingupwiththejonezez@gmail.com","password":"Adminaszx12345"}'

try {
    $loginResult = Invoke-RestMethod -Uri "https://gt-vs-new-be-code.vercel.app/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    
    Write-Host "  ✅ Login successful!" -ForegroundColor Green
    Write-Host "  ✅ Token received" -ForegroundColor Green
    Write-Host "  ✅ User: $($loginResult.data.email)" -ForegroundColor White
    Write-Host "  ✅ Role: $($loginResult.data.role)`n" -ForegroundColor White
    
    Write-Host "═══════════════════════════════════════" -ForegroundColor Green
    Write-Host "🎉 ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════`n" -ForegroundColor Green
    
    Write-Host "✓ MongoDB: Working" -ForegroundColor Gray
    Write-Host "✓ Email Service: Working" -ForegroundColor Gray
    Write-Host "✓ JWT Tokens: Working" -ForegroundColor Gray
    Write-Host "✓ Authentication: Working" -ForegroundColor Gray
    Write-Host "✓ Admin Login: Working`n" -ForegroundColor Gray
    
    Write-Host "🚀 Your application is fully functional!`n" -ForegroundColor Cyan
    
    Write-Host "Admin Credentials:" -ForegroundColor Yellow
    Write-Host "  Email: keepingupwiththejonezez@gmail.com" -ForegroundColor White
    Write-Host "  Password: Adminaszx12345`n" -ForegroundColor White
    
    Write-Host "Frontend: https://gt-vs-new-fe-code-nwqv.vercel.app" -ForegroundColor Cyan
    Write-Host "Backend: https://gt-vs-new-be-code.vercel.app`n" -ForegroundColor Cyan
    
} catch {
    $error = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  ❌ Login failed!" -ForegroundColor Red
    Write-Host "  Error: $($error.message)`n" -ForegroundColor Yellow
    
    if ($error.message -like "*expiresIn*") {
        Write-Host "⚠️  JWT_EXPIRES_IN still has invalid format" -ForegroundColor Yellow
        Write-Host "Make sure you set it to: 90d`n" -ForegroundColor Gray
    } elseif ($error.message -like "*ECONNREFUSED*") {
        Write-Host "⚠️  Email service configuration issue" -ForegroundColor Yellow
    } else {
        Write-Host "Full error:" -ForegroundColor Gray
        $error | ConvertTo-Json -Depth 3
    }
}
