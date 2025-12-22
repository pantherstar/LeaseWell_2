#!/bin/bash

# LeaseWell Startup Script

echo "🚀 Starting LeaseWell..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ] && [ ! -f "backend/.installed" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    pip install -r requirements.txt
    touch .installed
    cd ..
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  No .env file found. Creating from example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "Please create backend/.env manually"
    echo "📝 Please edit backend/.env with your database credentials"
    echo ""
fi

# Start backend in background
echo "🔧 Starting backend server on http://localhost:8000"
cd backend
python run.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server on http://localhost:8080"
cd frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ LeaseWell is running!"
echo ""
echo "📍 Backend API: http://localhost:8000"
echo "📍 Frontend: http://localhost:8080"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

