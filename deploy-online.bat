@echo off
echo 🌐 VMD-AI Meeting Companion - Online Deployment
echo ================================================

echo.
echo 🚀 Choose your deployment platform:
echo 1. Railway (Recommended - Free, Easy)
echo 2. Heroku (Classic, Reliable)
echo 3. Render (Simple, Free tier)
echo 4. Manual deployment instructions
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto railway
if "%choice%"=="2" goto heroku  
if "%choice%"=="3" goto render
if "%choice%"=="4" goto manual
goto invalid

:railway
echo.
echo 🚂 Railway Deployment
echo ====================
echo 1. Go to https://railway.app
echo 2. Sign up/Login with GitHub
echo 3. Click "New Project" → "Deploy from GitHub repo"
echo 4. Upload the 'server' folder from this project
echo 5. Set environment variable:
echo    OPENAI_API_KEY=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
echo 6. Deploy! You'll get a URL like: https://vmd-ai-meeting-companion.railway.app
echo.
echo Opening Railway...
start https://railway.app
goto end

:heroku
echo.
echo 🟣 Heroku Deployment  
echo ===================
echo 1. Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
echo 2. Run: heroku login
echo 3. Run: heroku create vmd-ai-meeting-companion
echo 4. Set API key: heroku config:set OPENAI_API_KEY=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
echo 5. Deploy from server folder
echo.
echo Opening Heroku...
start https://heroku.com
goto end

:render
echo.
echo 🎨 Render Deployment
echo ===================
echo 1. Go to https://render.com
echo 2. Sign up/Login
echo 3. Click "New +" → "Web Service"
echo 4. Upload the 'server' folder
echo 5. Set Build Command: npm install
echo 6. Set Start Command: node src/simple-server.js
echo 7. Add environment variable:
echo    OPENAI_API_KEY=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
echo.
echo Opening Render...
start https://render.com
goto end

:manual
echo.
echo 📖 Manual Deployment Instructions
echo =================================
echo See DEPLOYMENT.md for detailed instructions
echo Opening deployment guide...
start DEPLOYMENT.md
goto end

:invalid
echo Invalid choice. Please run the script again.
goto end

:end
echo.
echo ✅ After deployment:
echo 1. Test your server at: https://your-app-url/health
echo 2. Reload the Chrome extension
echo 3. The extension will automatically connect to your online server!
echo.
echo 🎉 Your VMD-AI Meeting Companion will be live online!
pause
