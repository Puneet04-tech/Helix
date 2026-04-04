#!/bin/bash

echo ""
echo "=========================================="
echo "   🏨 Hotel Management System Startup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js is not installed or not in PATH"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start Backend
echo ""
echo "📦 Starting Hotel Backend (Port 4000)..."
cd backend
npm install --silent
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo ""
echo "💻 Starting Hotel Frontend (Port 4001)..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

# Show URLs
echo ""
echo "=========================================="
echo "   ✨ System Startup Complete!"
echo "=========================================="
echo ""
echo "🏨 Hotel Dashboard:    http://localhost:4001"
echo "🌐 Hotel API:          http://localhost:4000/api"
echo "📊 Helix Dashboard:    http://localhost:3003"
echo ""
echo "⚠️  Make sure Helix Backend is running on port 5000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
