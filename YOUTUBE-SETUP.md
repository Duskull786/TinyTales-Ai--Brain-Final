# 📺 YouTube Auto-Upload Setup Guide

## Your TinyTales Channel
- **Channel URL**: https://www.youtube.com/@TinyTales-x6c
- **Studio URL**: https://studio.youtube.com/channel/UC3tgiuwsxSoW4KYav6LzSNA
- **Channel ID**: UC3tgiuwsxSoW4KYav6LzSNA

## FREE YouTube API Setup (Required for Auto-Upload)

### Step 1: Get YouTube Data API Key (FREE)
1. Go to: https://console.cloud.google.com/
2. Create new project: "TinyTales-AutoUpload"
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Copy the API key

### Step 2: Set up OAuth for Uploads (FREE)
1. In Google Cloud Console → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: Desktop application
4. Name: "TinyTales Video Uploader"
5. Download the JSON file

### Step 3: Add to Environment
```bash
# Add to .env file:
YOUTUBE_API_KEY=your_api_key_here
YOUTUBE_CHANNEL_ID=UC3tgiuwsxSoW4KYav6LzSNA
GOOGLE_CLIENT_ID=from_oauth_json
GOOGLE_CLIENT_SECRET=from_oauth_json
```

## 🎯 Upload Schedule
- **Daily at 9:00 AM EST**: New TinyTales video auto-uploaded
- **Content**: Child-friendly educational stories
- **Duration**: 3-5 minutes each
- **Quality**: 1080p with animations

## 💰 Cost: $0.00 (FREE YouTube API - 10,000 calls/day)