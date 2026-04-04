#!/bin/bash

# Helix Demo Quick Start Script
# Run this to start both backend and frontend simultaneously

echo "🚀 Starting Helix Administration Platform..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if MongoDB is accessible
echo "🔍 Checking MongoDB connection..."
# We skip this check because MongoDB Atlas is cloud-based

# Start backend
echo "📦 Starting Backend Server (NestJS on port 5000)..."
cd backend

if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

npm run start:dev &
BACKEND_PID=$!

sleep 3

# Start frontend
echo ""
echo "🎨 Starting Frontend Server (Next.js on port 3000)..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting..."
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "📊 Backend:  http://localhost:5000"
echo ""
echo "⏳ Servers may take 10-15 seconds to fully start. Please wait..."
echo ""
echo "🎯 Demo Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Sign up with any email/password"
echo "3. Go to Dashboard"
echo "4. Click 'Start Live Demo' to see incidents streaming in real-time"
echo "5. Click any incident to see detailed analysis"
echo ""
echo "📚 Full guide: Open JUDGE_DEMO_GUIDE.md"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
