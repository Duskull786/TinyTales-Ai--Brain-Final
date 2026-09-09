# 🚀 TinyTales AI Brain Setup Guide

Your autonomous YouTube kids channel system is ready! Follow these steps to get it operational.

## 📋 Required API Keys & Setup

### 1. **AI Services** (Essential for content creation)
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your API keys
nano .env  # or use your preferred editor
```

**Required API Keys:**
- **Anthropic API**: Get from https://console.anthropic.com/
- **OpenAI API**: Get from https://platform.openai.com/api-keys
- **ElevenLabs** (optional, for premium voice): https://elevenlabs.io/
- **YouTube Data API**: Get from Google Cloud Console

### 2. **YouTube Setup** (For uploading videos)
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Download the credentials JSON file

### 3. **Database Setup**
```bash
# Install MongoDB (if not already installed)
# Ubuntu/Debian:
sudo apt update && sudo apt install -y mongodb

# macOS:
brew install mongodb/brew/mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

## 🔧 Quick Start Commands

```bash
# Install dependencies (already done)
npm install

# Create your environment file
cp .env.example .env

# Edit with your API keys
nano .env

# Start the AI brain
npm start

# Or run in development mode
npm run dev
```

## 🎯 Minimum Required Setup

**To get started immediately, you need:**
1. **Anthropic API key** - For script generation
2. **OpenAI API key** - For voice & images 
3. **MongoDB running** - For data storage

**Optional (add later):**
- YouTube API - For automated uploads
- ElevenLabs - For premium voice quality
- Analytics APIs - For performance tracking

## 🧪 Test Your Setup

```bash
# Test basic functionality
node -e "
import { AIBrain } from './src/core/AIBrain.js';
console.log('✅ TinyTales AI Brain ready to initialize!');
"
```

## 📊 System Status Dashboard

Once running, your AI brain will:
- ✅ Generate daily story scripts (9 AM)
- ✅ Monitor comments every 5 minutes
- ✅ Create videos automatically
- ✅ Track performance & optimize

## 🔗 Next Steps

1. **Get API Keys**: Start with Anthropic + OpenAI
2. **Configure .env**: Add your keys
3. **Start MongoDB**: Ensure database is running
4. **Launch**: Run `npm start`
5. **Monitor**: Watch the logs for autonomous operations

Your TinyTales channel will be operational 24/7 once configured!