# 🎯 YOUTUBE API SETUP - STEP BY STEP GUIDE

## Your TinyTales Channel Details
- **Channel**: https://www.youtube.com/@TinyTales-x6c
- **Studio**: https://studio.youtube.com/channel/UC3tgiuwsxSoW4KYav6LzSNA  
- **Channel ID**: UC3tgiuwsxSoW4KYav6LzSNA

## 🆓 FREE YouTube Data API Setup (5 minutes)

### Step 1: Google Cloud Console Setup
1. Go to: **https://console.cloud.google.com/**
2. Click "Create Project"
3. Project name: `TinyTales-AutoUpload`
4. Click "Create"

### Step 2: Enable YouTube Data API  
1. In the search bar, type: `YouTube Data API v3`
2. Click on "YouTube Data API v3"
3. Click **"Enable"**

### Step 3: Create API Credentials
1. Click **"Credentials"** in left sidebar
2. Click **"+ Create Credentials"** 
3. Select **"API Key"**
4. Copy the API key (starts with `AIza...`)

### Step 4: Create OAuth for Uploads
1. Still in Credentials, click **"+ Create Credentials"**
2. Select **"OAuth client ID"**
3. Choose **"Desktop application"** 
4. Name: `TinyTales-VideoUploader`
5. Click **"Create"**
6. **Download JSON file** (save as `oauth-credentials.json`)

### Step 5: Add to Your .env File
```bash
# Open your .env file and add:
YOUTUBE_API_KEY=AIza_your_api_key_here
YOUTUBE_CHANNEL_ID=UC3tgiuwsxSoW4KYav6LzSNA
GOOGLE_CLIENT_ID=from_oauth_json_file
GOOGLE_CLIENT_SECRET=from_oauth_json_file
```

## 🚀 Test Your Setup (1 minute)
```bash
# Test API connection
curl "https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC3tgiuwsxSoW4KYav6LzSNA&key=YOUR_API_KEY"
```

## 📅 Auto-Upload Schedule
- **Daily at 9:00 AM EST**: New video uploaded
- **Format**: MP4, 1080p quality
- **Title**: Auto-generated with SEO keywords
- **Description**: Educational content for kids
- **Tags**: #TinyTales #KidsStories #Educational

## 💡 Pro Tips
- **Quota**: 10,000 free API calls per day (more than enough)
- **Cost**: $0.00 - Completely FREE
- **Uploads**: Unlimited with proper OAuth setup
- **Analytics**: Full access to video performance data

## 🔐 Security Notes
- Keep your API key private
- Never commit OAuth credentials to GitHub  
- The system only uploads to YOUR channel
- All uploads are reviewed by YouTube's safety systems

---
**Setup Time**: 5 minutes  
**Monthly Cost**: $0.00  
**Daily Videos**: Unlimited  

Your TinyTales channel will be fully automated! 🎉