#!/bin/zsh
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${1:-8080}

echo "Building MarketProbe frontend..."
(cd "$SCRIPT_DIR/frontend" && npm run build)

echo "Starting unified MarketProbe server on http://localhost:$PORT ..."
cd "$SCRIPT_DIR"
exec python3 -m uvicorn src.backend.api:app --host 0.0.0.0 --port "$PORT"
