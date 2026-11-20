# Single-container production Dockerfile for Hugging Face Spaces (Docker Space, port 7860)
FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/.cache/huggingface
ENV PORT=7860

# Install system dependencies & Node.js 20 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Step 1: Install Python backend dependencies & pre-cache MiniLM model
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt sentence-transformers

RUN mkdir -p /app/.cache/huggingface && \
    python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')" || true

# Step 2: Install frontend dependencies and build Next.js application
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_USE_PROXY=true
RUN npm run build

# Step 3: Copy backend source code & startup orchestration script
WORKDIR /app
COPY backend/ ./backend/
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Ensure non-root HF Spaces user has full read/write permissions
RUN mkdir -p /app/backend/data && \
    chmod -R 777 /app && \
    chmod -R 777 /tmp

EXPOSE 7860

CMD ["/app/start.sh"]
