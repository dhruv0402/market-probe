# ==========================================================
# MarketProbe Enterprise Multi-Stage Production Container
# ==========================================================

# Stage 1: Build Optimized React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python API & Inference Engine
FROM python:3.11-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    MARKETPROBE_DB_PATH=/app/data/marketprobe.db \
    MARKETPROBE_MODEL_PATH=/app/data/xgb_model.pkl

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend, data, and scripts
COPY src/ ./src/
COPY data/ ./data/
COPY docs/ ./docs/
COPY *.py ./

# Copy built frontend into dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["python", "-m", "uvicorn", "src.backend.api:app", "--host", "0.0.0.0", "--port", "8080"]
