#!/bin/bash
# Startup script to ensure redirect-service is running

echo "🚀 Starting redirect-service if not already running..."

# Check if redirect-service is running
if ! pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "📦 Redirect-service not running, starting it..."
    cd /app/redirect-service
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        yarn install --production=false
    fi
    
    # Build if dist folder doesn't exist
    if [ ! -d "dist" ]; then
        echo "🔨 Building redirect-service..."
        yarn build
    fi
    
    # Start the service in background
    nohup node dist/index.js > /var/log/redirect-service.log 2>&1 &
    
    # Wait a bit for it to start
    sleep 3
    
    # Check if it started successfully
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Redirect-service started successfully!"
    else
        echo "❌ Redirect-service failed to start, check /var/log/redirect-service.log"
    fi
else
    echo "✅ Redirect-service already running"
fi
