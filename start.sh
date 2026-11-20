#!/bin/bash
set -e

echo '========================================================'
echo '  VERIMIND AI — SINGLE-CONTAINER RUNTIME INITIALIZATION'
echo '  Platform: Hugging Face Spaces (Port 7860)'
echo '========================================================'

# Start FastAPI backend daemon on 127.0.0.1:8000
echo '[1/2] Starting FastAPI backend on 127.0.0.1:8000...'
cd /app/backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend health endpoint to respond with HTTP 200
echo '[2/2] Awaiting backend health verification (/api/health)...'
for i in {1..30}; do
  if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo '  ✓ FastAPI backend is live and healthy!'
    break
  fi
  sleep 1
done

# Start Next.js frontend proxy server on 0.0.0.0:7860
echo '[3/3] Starting Next.js frontend proxy on 0.0.0.0:7860...'
cd /app/frontend
exec npm run start -- -H 0.0.0.0 -p 7860
