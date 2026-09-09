#!/bin/bash

# 🤖 TinyTales Auto-Launch Monitor Script
# Monitors Ollama download and auto-starts when ready

echo "🔄 TinyTales AI Brain - Auto-Launch Monitor"
echo "📅 $(date)"
echo "⏰ Monitoring Llama 3.1 download progress..."

while true; do
    # Check if Llama model is available
    if ollama list | grep -q "llama3.1"; then
        echo "✅ Llama 3.1 download COMPLETE!"
        echo "🚀 Auto-starting TinyTales AI Brain..."

        # Start the FREE AI Brain system
        node src/free-index.js

        break
    else
        # Show download progress
        PROGRESS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models | length' 2>/dev/null || echo "0")
        echo "⏳ Still downloading... Models available: $PROGRESS"

        # Wait 30 seconds before checking again
        sleep 30
    fi
done

echo "🎉 TinyTales AI Brain is now ACTIVE!"
echo "📺 First video will be generated shortly..."
echo "🔗 Channel: https://www.youtube.com/@TinyTales-x6c"