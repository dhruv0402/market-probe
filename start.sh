#!/bin/zsh
BACKEND_PORT=${1:-8081}
FRONTEND_PORT=${2:-5175}

pkill -f uvicorn
pkill -f node

export VITE_BACKEND_PORT=$BACKEND_PORT

echo "Starting backend..."
cd /Users/dhruvgourisaria/marketprobe && uvicorn src.backend.api:app --host 0.0.0.0 --port $BACKEND_PORT --reload &

echo "Starting frontend..."
cd /Users/dhruvgourisaria/marketprobe/frontend && npx vite --port $FRONTEND_PORT --strictPort --host
