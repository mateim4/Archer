# Use Ubuntu 22.04 as base image
FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Core build tools
    build-essential \
    pkg-config \
    curl \
    file \
    git \
    # GTK and WebKit dependencies
    libjavascriptcoregtk-4.0-dev \
    libwebkit2gtk-4.0-dev \
    libgtk-4-dev \
    # Tauri dependencies
    libappindicator3-dev \
    librsvg2-dev \
    libssl-dev \
    # Additional utilities
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS version)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Tauri CLI
RUN cargo install tauri-cli

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY Cargo.toml ./
COPY src-tauri/Cargo.toml ./src-tauri/

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the development server port
EXPOSE 1420
EXPOSE 3001

# Default command
CMD ["npm", "run", "dev"]
