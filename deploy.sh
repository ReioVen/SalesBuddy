#!/bin/bash

# SalesBuddy Deployment Script
# This script will deploy your changes to salesbuddy.pro

echo "🚀 SalesBuddy Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the SalesBuddy root directory"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo "Do you want to commit them? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        echo "📝 Committing changes..."
        git add .
        git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    else
        echo "❌ Please commit your changes first"
        exit 1
    fi
fi

# Push to main branch
echo "📤 Pushing to main branch..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🔄 Auto-deployment should start now:"
echo "   • Backend: Railway will auto-deploy"
echo "   • Frontend: Vercel will auto-deploy"
echo ""
echo "⏳ Please wait 2-3 minutes for deployment to complete"
echo ""
echo "🧪 Test your deployment:"
echo "   • Main app: https://salesbuddy.pro"
echo "   • API health: https://salesbuddy-production.up.railway.app/health"
echo ""
echo "📊 Monitor deployment:"
echo "   • Railway: https://railway.app/dashboard"
echo "   • Vercel: https://vercel.com/dashboard"
echo ""
echo "🎉 Deployment initiated! Check the URLs above in a few minutes."
