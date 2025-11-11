#!/bin/bash

# LCM Designer Dependency Setup Script
# This script helps set up the required system dependencies for the LCM Designer project

set -e

echo "🚀 LCM Designer Dependency Setup"
echo "================================"

# Detect the operating system
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v apt &> /dev/null; then
        DISTRO="debian"
    elif command -v dnf &> /dev/null; then
        DISTRO="fedora"
    elif command -v yum &> /dev/null; then
        DISTRO="rhel"
    elif command -v pacman &> /dev/null; then
        DISTRO="arch"
    else
        echo "❌ Unsupported Linux distribution"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    DISTRO="macos"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "📋 Detected OS: $DISTRO"

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to check if pkg-config can find a package
pkg_config_exists() {
    pkg-config --exists "$1" 2>/dev/null
}

# Install dependencies based on the distribution
install_dependencies() {
    case $DISTRO in
        "debian")
            echo "📦 Installing dependencies for Debian/Ubuntu..."
            sudo apt update
            sudo apt install -y \
                libjavascriptcoregtk-4.0-dev \
                libwebkit2gtk-4.0-dev \
                libgtk-4-dev \
                libappindicator3-dev \
                librsvg2-dev \
                libssl-dev \
                pkg-config \
                build-essential \
                curl \
                file
            ;;
        "fedora")
            echo "📦 Installing dependencies for Fedora..."
            sudo dnf install -y \
                webkit2gtk4.0-devel \
                gtk4-devel \
                libappindicator-gtk3-devel \
                librsvg2-devel \
                openssl-devel \
                pkgconfig \
                gcc \
                gcc-c++ \
                curl \
                file
            ;;
        "rhel")
            echo "📦 Installing dependencies for RHEL/CentOS..."
            sudo yum install -y \
                webkit2gtk4.0-devel \
                gtk4-devel \
                libappindicator-gtk3-devel \
                librsvg2-devel \
                openssl-devel \
                pkgconfig \
                gcc \
                gcc-c++ \
                curl \
                file
            ;;
        "arch")
            echo "📦 Installing dependencies for Arch Linux..."
            sudo pacman -S --needed \
                webkit2gtk \
                gtk4 \
                libappindicator-gtk3 \
                librsvg \
                openssl \
                pkgconf \
                base-devel \
                curl \
                file
            ;;
        "macos")
            echo "📦 Installing dependencies for macOS..."
            if ! command_exists brew; then
                echo "❌ Homebrew not found. Please install Homebrew first:"
                echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
                exit 1
            fi
            brew install \
                gtk4 \
                webkit2gtk \
                pkg-config
            ;;
    esac
}

# Install Node.js if not present
install_nodejs() {
    if ! command_exists node; then
        echo "📦 Installing Node.js..."
        case $DISTRO in
            "debian")
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            "fedora"|"rhel")
                sudo dnf install -y nodejs npm
                ;;
            "arch")
                sudo pacman -S --needed nodejs npm
                ;;
            "macos")
                brew install node
                ;;
        esac
    else
        echo "✅ Node.js is already installed ($(node --version))"
    fi
}

# Install Rust if not present
install_rust() {
    if ! command_exists cargo; then
        echo "📦 Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
    else
        echo "✅ Rust is already installed ($(cargo --version))"
    fi
}

# Verify installations
verify_dependencies() {
    echo "🔍 Verifying dependencies..."
    
    # Check pkg-config
    if ! command_exists pkg-config; then
        echo "❌ pkg-config not found"
        return 1
    fi
    
    # Check JavaScriptCore GTK
    if pkg_config_exists "javascriptcoregtk-4.0"; then
        echo "✅ JavaScriptCore GTK 4.0 found ($(pkg-config --modversion javascriptcoregtk-4.0))"
    else
        echo "❌ JavaScriptCore GTK 4.0 not found"
        echo "   Try alternative package names or manual installation"
        return 1
    fi
    
    # Check Node.js
    if command_exists node; then
        echo "✅ Node.js found ($(node --version))"
    else
        echo "❌ Node.js not found"
        return 1
    fi
    
    # Check Rust
    if command_exists cargo; then
        echo "✅ Rust found ($(cargo --version))"
    else
        echo "❌ Rust not found"
        return 1
    fi
    
    echo "✅ All dependencies verified!"
}

# Create a fallback pkg-config file if needed
create_fallback_pkgconfig() {
    if ! pkg_config_exists "javascriptcoregtk-4.0"; then
        echo "🔧 Creating fallback pkg-config file..."
        
        # Try to find the library
        LIB_PATH=""
        for path in /usr/lib /usr/lib64 /usr/local/lib /opt/homebrew/lib; do
            if [[ -f "$path/libjavascriptcoregtk-4.0.so" ]] || [[ -f "$path/libjavascriptcoregtk-4.0.dylib" ]]; then
                LIB_PATH="$path"
                break
            fi
        done
        
        if [[ -n "$LIB_PATH" ]]; then
            PKGCONFIG_DIR="$HOME/.local/lib/pkgconfig"
            mkdir -p "$PKGCONFIG_DIR"
            
            cat > "$PKGCONFIG_DIR/javascriptcoregtk-4.0.pc" << EOF
prefix=/usr
exec_prefix=\${prefix}
libdir=$LIB_PATH
includedir=\${prefix}/include

Name: JavaScriptCore GTK 4.0
Description: JavaScript engine from WebKit with GTK+ 4.0 bindings
Version: 2.40.0
Requires: gtk4
Libs: -L\${libdir} -ljavascriptcoregtk-4.0
Cflags: -I\${includedir}/webkitgtk-4.0
EOF
            
            export PKG_CONFIG_PATH="$PKGCONFIG_DIR:$PKG_CONFIG_PATH"
            echo "✅ Created fallback pkg-config file at $PKGCONFIG_DIR/javascriptcoregtk-4.0.pc"
            echo "   Add this to your ~/.bashrc or ~/.zshrc:"
            echo "   export PKG_CONFIG_PATH=\"$PKGCONFIG_DIR:\$PKG_CONFIG_PATH\""
        fi
    fi
}

# Main installation process
main() {
    echo "Starting dependency installation..."
    
    install_dependencies
    install_nodejs
    install_rust
    
    # Source Rust environment
    if [[ -f "$HOME/.cargo/env" ]]; then
        source "$HOME/.cargo/env"
    fi
    
    create_fallback_pkgconfig
    
    if verify_dependencies; then
        echo "🎉 All dependencies installed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Navigate to the project directory"
        echo "2. Run 'npm install' to install Node.js dependencies"
        echo "3. Run 'cargo build' to build Rust dependencies"
        echo "4. Run 'npm run dev' to start the development server"
    else
        echo "❌ Some dependencies are missing. Please check the output above."
        echo "   See DEPENDENCIES.md for manual installation instructions."
        exit 1
    fi
}

# Run main function
main "$@"
