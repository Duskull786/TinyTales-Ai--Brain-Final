#!/bin/bash

# 🆓 TinyTales FREE AI Tools Installation Script
# Run this script to install all required free tools for your AI brain

echo "🚀 Installing TinyTales FREE AI Tools..."
echo "You may be prompted for your password (sudo required for some tools)"

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install MongoDB
echo "🗄️ Installing MongoDB..."
sudo apt install -y mongodb

# Install FFmpeg (video processing)
echo "🎬 Installing FFmpeg..."
sudo apt install -y ffmpeg

# Install espeak (backup voice synthesis)
echo "🎤 Installing espeak..."
sudo apt install -y espeak espeak-data

# Install Python virtual environment tools
echo "🐍 Installing Python tools..."
sudo apt install -y python3-venv python3-pip

# Create virtual environment for Python packages
echo "📦 Creating Python virtual environment..."
python3 -m venv ~/.tinytales-venv

# Install Edge TTS in virtual environment
echo "🎤 Installing Edge TTS..."
~/.tinytales-venv/bin/pip install edge-tts

# Install Ollama
echo "🤖 Installing Ollama..."
curl -fsSL https://ollama.ai/install.sh | sh

# Start MongoDB
echo "🗄️ Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Start Ollama and pull model
echo "🧠 Setting up Ollama AI model..."
ollama serve > /dev/null 2>&1 &
sleep 5
ollama pull llama3.1

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 Next steps:"
echo "1. cd /home/duskull/tinytales-ai-brain"
echo "2. node src/free-index.js"
echo ""
echo "🔧 Verify installation:"
echo "- MongoDB: systemctl status mongod"
echo "- FFmpeg: ffmpeg -version"
echo "- Edge TTS: ~/.tinytales-venv/bin/edge-tts --version"
echo "- Ollama: ollama list"