# 🌐 VMD-AI Meeting Companion - Online Deployment Guide

## 🚀 Quick Deploy Options

### Option 1: Deploy to Railway (Recommended - Free)

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Upload the `server` folder** or connect your GitHub repo
6. **Set Environment Variables:**
   ```
   OPENAI_API_KEY=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
   NODE_ENV=production
   ```
7. **Deploy!** - You'll get a URL like: `https://vmd-ai-meeting-companion.railway.app`

### Option 2: Deploy to Heroku

1. **Install Heroku CLI**
2. **Login:** `heroku login`
3. **Create app:** `heroku create vmd-ai-meeting-companion`
4. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=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
   heroku config:set NODE_ENV=production
   ```
5. **Deploy:**
   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial deployment"
   heroku git:remote -a vmd-ai-meeting-companion
   git push heroku main
   ```

### Option 3: Deploy to Render

1. **Go to [Render.com](https://render.com)**
2. **Sign up/Login**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repo** or upload files
5. **Configure:**
   - **Build Command:** `npm install`
   - **Start Command:** `node src/simple-server.js`
   - **Environment Variables:**
     ```
     OPENAI_API_KEY=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
     NODE_ENV=production
     ```

## 🔧 After Deployment

### Step 1: Test Your Deployed Server

Visit your deployed URL + `/health`:
- Railway: `https://your-app.railway.app/health`
- Heroku: `https://your-app.herokuapp.com/health`
- Render: `https://your-app.onrender.com/health`

You should see:
```json
{
  "name": "AI Meeting Companion Server",
  "version": "1.0.0", 
  "status": "running",
  "timestamp": "2025-08-09T..."
}
```

### Step 2: Update Extension

The extension is already configured to automatically detect and connect to your deployed server!

1. **Reload the extension** in Chrome
2. **Click the extension icon**
3. **Check "Server" status** - should show "Connected"
4. **The extension will automatically use your online server**

### Step 3: Test Online Functionality

1. **Go to Google Meet/Zoom/Teams**
2. **Click "Start Recording"**
3. **Your online server will handle all AI processing**
4. **Real OpenAI integration is now active!**

## 🎯 Server URLs

The extension will automatically try these URLs in order:
1. `https://vmd-ai-meeting-companion.herokuapp.com`
2. `https://vmd-ai-meeting-companion.railway.app`
3. `https://vmd-ai-meeting-companion.onrender.com`
4. `http://localhost:3000` (fallback for development)

## 🔐 Security Notes

- ✅ CORS configured for meeting platforms
- ✅ OpenAI API key secured in environment variables
- ✅ HTTPS enforced in production
- ✅ Chrome extension permissions properly scoped

## 🎉 You're Live!

Once deployed, your VMD-AI Meeting Companion will be running online with:
- ✅ Real OpenAI transcription
- ✅ Live AI analysis
- ✅ Global accessibility
- ✅ Professional deployment

**Choose your preferred platform and deploy now!** 🚀
