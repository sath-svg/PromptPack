#!/bin/bash

# Build script for macOS versions of PromptPack Desktop
# This script builds Universal, Intel, and Apple Silicon versions

set -e

echo "🍎 Building PromptPack for macOS..."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This script must be run on macOS"
    exit 1
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Error: Rust is not installed"
    echo "Install from https://rustup.rs/"
    exit 1
fi

# Function to build for specific target
build_target() {
    local target=$1
    local name=$2

    echo "📦 Building $name ($target)..."

    # Add target if not already added
    rustup target add "$target" 2>/dev/null || true

    # Build
    npm run tauri build -- --target "$target"

    echo "✅ $name build complete"
    echo ""
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
    echo ""
fi

# Build frontend
echo "🔨 Building frontend..."
npm run build
echo ""

# Prompt user for build type
echo "Select build type:"
echo "1) Universal Binary (Intel + Apple Silicon) - Recommended"
echo "2) Intel only (x86_64)"
echo "3) Apple Silicon only (aarch64)"
echo "4) All builds"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        build_target "universal-apple-darwin" "Universal Binary"
        ;;
    2)
        build_target "x86_64-apple-darwin" "Intel"
        ;;
    3)
        build_target "aarch64-apple-darwin" "Apple Silicon"
        ;;
    4)
        build_target "universal-apple-darwin" "Universal Binary"
        build_target "x86_64-apple-darwin" "Intel"
        build_target "aarch64-apple-darwin" "Apple Silicon"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "🎉 Build complete!"
echo ""
echo "📁 Build artifacts location:"

case $choice in
    1)
        echo "   Universal: src-tauri/target/universal-apple-darwin/release/bundle/"
        ;;
    2)
        echo "   Intel: src-tauri/target/x86_64-apple-darwin/release/bundle/"
        ;;
    3)
        echo "   Apple Silicon: src-tauri/target/aarch64-apple-darwin/release/bundle/"
        ;;
    4)
        echo "   Universal: src-tauri/target/universal-apple-darwin/release/bundle/"
        echo "   Intel: src-tauri/target/x86_64-apple-darwin/release/bundle/"
        echo "   Apple Silicon: src-tauri/target/aarch64-apple-darwin/release/bundle/"
        ;;
esac

echo ""
echo "📝 Files to distribute:"
echo "   - .dmg (installer)"
echo "   - .app (application bundle)"
