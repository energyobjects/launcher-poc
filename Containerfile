# Stage 1: build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build -- --outDir /build/static

# Stage 2: Python runtime
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install dependencies (cached layer — only reruns when lockfile changes)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code and built frontend
COPY main.py ./
COPY backend/ backend/
COPY --from=frontend-builder /build/static static/

EXPOSE 8000

ENV HOST=0.0.0.0
ENV NO_BROWSER=1
ENV PYTHONUNBUFFERED=1

ENV PATH="/app/.venv/bin:$PATH"
CMD ["python", "main.py"]
