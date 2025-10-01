@echo off
REM SalesBuddy Deployment Script for Windows
REM This script will deploy your changes to salesbuddy.pro

echo 🚀 SalesBuddy Deployment Script
echo ================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the SalesBuddy root directory
    pause
    exit /b 1
)

REM Check if git is clean
git status --porcelain > temp_status.txt
set /p status_content=<temp_status.txt
del temp_status.txt

if not "%status_content%"=="" (
    echo ⚠️  Warning: You have uncommitted changes
    echo Do you want to commit them? (y/n)
    set /p response=
    if "%response%"=="y" (
        echo 📝 Committing changes...
        git add .
        git commit -m "Deploy: %date% %time%"
    ) else (
        echo ❌ Please commit your changes first
        pause
        exit /b 1
    )
)

REM Push to main branch
echo 📤 Pushing to main branch...
git push origin main

echo.
echo ✅ Code pushed to GitHub!
echo.
echo 🔄 Auto-deployment should start now:
echo    • Backend: Railway will auto-deploy
echo    • Frontend: Vercel will auto-deploy
echo.
echo ⏳ Please wait 2-3 minutes for deployment to complete
echo.
echo 🧪 Test your deployment:
echo    • Main app: https://salesbuddy.pro
echo    • API health: https://salesbuddy-production.up.railway.app/health
echo.
echo 📊 Monitor deployment:
echo    • Railway: https://railway.app/dashboard
echo    • Vercel: https://vercel.com/dashboard
echo.
echo 🎉 Deployment initiated! Check the URLs above in a few minutes.
pause
