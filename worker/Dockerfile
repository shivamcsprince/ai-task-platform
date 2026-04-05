# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM python:3.11-slim AS production

# Create non-root user
RUN groupadd -r worker && useradd -r -g worker workeruser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Change ownership
RUN chown -R workeruser:worker /app
USER workeruser

# Healthcheck — verify the worker process is alive by checking Redis connectivity
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import redis, os; r=redis.Redis(host=os.getenv('REDIS_HOST','localhost'),password=os.getenv('REDIS_PASSWORD')); r.ping()" || exit 1

CMD ["python", "main.py"]
