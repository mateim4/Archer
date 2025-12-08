# Multi-stage build for Archer AI Engine
FROM python:3.11-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libmagic1 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# =========================================
# Development stage
# =========================================
FROM base AS development

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run with hot reload
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# =========================================
# Production stage
# =========================================
FROM base AS production

# Create non-root user
RUN useradd -m -u 1000 archer && \
    mkdir -p /app /data && \
    chown -R archer:archer /app /data

USER archer

WORKDIR /app

# Copy requirements and install
COPY --chown=archer:archer requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Add local pip bin to PATH
ENV PATH="/home/archer/.local/bin:${PATH}"

# Copy application code
COPY --chown=archer:archer . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health')" || exit 1

# Expose port
EXPOSE 8000

# Run with production settings
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
