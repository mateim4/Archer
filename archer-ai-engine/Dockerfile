# Multi-stage Dockerfile for Archer AI Engine
# Stage 1: Builder stage with all dependencies
FROM python:3.11-slim as builder

WORKDIR /build

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage with minimal footprint
FROM python:3.11-slim

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash archer && \
    mkdir -p /app && \
    chown -R archer:archer /app

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/archer/.local

# Copy application code
COPY --chown=archer:archer . .

# Switch to non-root user
USER archer

# Add local Python packages to PATH
ENV PATH=/home/archer/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health/live')" || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
