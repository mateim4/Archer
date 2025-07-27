# LCM Designer Dependencies

This document outlines the system dependencies required to build and run the LCM Designer project.

## System Requirements

### Primary Dependencies

The project requires the following system dependencies:

#### JavaScriptCore GTK 4.0
- **Package**: `javascriptcoregtk-4.0`
- **Description**: JavaScript engine from WebKit with GTK+ 4.0 bindings
- **Required files**:
  - `javascriptcoregtk-4.0.pc` (pkg-config file)
  - `libjavascriptcoregtk-4.0.so` (shared library)
  - `libjavascriptcoregtk-4.0.a` (static library, optional)
  - Header files in `/usr/include/webkitgtk-4.0/JavaScriptCore/`

## Installation Instructions

### Ubuntu/Debian Systems

```bash
# Update package list
sudo apt update

# Install JavaScriptCore GTK 4.0 development packages
sudo apt install \
    libjavascriptcoregtk-4.0-dev \
    libwebkit2gtk-4.0-dev \
    libgtk-4-dev \
    pkg-config

# Verify installation
pkg-config --exists javascriptcoregtk-4.0 && echo "✅ JavaScriptCore GTK 4.0 found" || echo "❌ JavaScriptCore GTK 4.0 not found"
```

### Fedora/CentOS/RHEL Systems

```bash
# Install development packages
sudo dnf install \
    webkit2gtk4.0-devel \
    gtk4-devel \
    pkgconfig

# Alternative for older systems
sudo yum install \
    webkit2gtk4.0-devel \
    gtk4-devel \
    pkgconfig
```

### Arch Linux

```bash
# Install packages
sudo pacman -S \
    webkit2gtk \
    gtk4 \
    pkgconf
```

### macOS (via Homebrew)

```bash
# Install GTK and WebKit
brew install \
    gtk4 \
    webkit2gtk \
    pkg-config
```

## Manual Installation (if packages are unavailable)

If the standard packages are not available on your system, you may need to build WebKit from source:

### Building WebKit from Source

```bash
# Install build dependencies
sudo apt install \
    build-essential \
    cmake \
    ninja-build \
    python3 \
    perl \
    ruby \
    gperf \
    bison \
    flex

# Clone WebKit
git clone https://github.com/WebKit/WebKit.git
cd WebKit

# Build with GTK4 support
./Tools/Scripts/build-webkit --gtk --cmakeargs="-DUSE_GTK4=ON"
```

## Verification

After installation, verify the dependencies are correctly installed:

```bash
# Check pkg-config can find the library
pkg-config --modversion javascriptcoregtk-4.0

# Check library files exist
ldconfig -p | grep javascriptcore

# Verify header files
ls -la /usr/include/webkitgtk-4.0/JavaScriptCore/
```

## Troubleshooting

### Common Issues

1. **Package not found**: Try alternative package names like `libwebkit2gtk-4.0-dev`
2. **Wrong version**: Ensure you're installing GTK 4.0 version, not GTK 3.0
3. **Missing pkg-config**: Install `pkg-config` or `pkgconf` package

### Manual pkg-config File

If you have the libraries but missing the pkg-config file, create `/usr/lib/pkgconfig/javascriptcoregtk-4.0.pc`:

```ini
prefix=/usr
exec_prefix=${prefix}
libdir=${exec_prefix}/lib
includedir=${prefix}/include

Name: JavaScriptCore GTK 4.0
Description: JavaScript engine from WebKit with GTK+ 4.0 bindings
Version: 2.40.0
Requires: gtk4
Libs: -L${libdir} -ljavascriptcoregtk-4.0
Cflags: -I${includedir}/webkitgtk-4.0
```

## Project-Specific Setup

### Tauri Dependencies

This project uses Tauri, which requires additional dependencies:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js dependencies
npm install

# Install Tauri CLI
cargo install tauri-cli

# Install system dependencies for Tauri
sudo apt install \
    libwebkit2gtk-4.0-dev \
    libappindicator3-dev \
    librsvg2-dev \
    libssl-dev
```

### Development Setup

1. Clone the repository
2. Install system dependencies (see above)
3. Install Node.js dependencies: `npm install`
4. Install Rust dependencies: `cargo build`
5. Start development server: `npm run dev`

## Support

If you continue to have issues with dependencies:

1. Check your distribution's package manager for WebKit packages
2. Consider using a Docker container with pre-installed dependencies
3. Use a virtual machine with a supported Linux distribution
4. Contact the development team with specific error messages

## Docker Alternative

For consistent development environment, use Docker:

```dockerfile
FROM ubuntu:22.04

RUN apt update && apt install -y \
    libjavascriptcoregtk-4.0-dev \
    libwebkit2gtk-4.0-dev \
    libgtk-4-dev \
    pkg-config \
    nodejs \
    npm \
    curl

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

WORKDIR /app
COPY . .
RUN npm install
```
