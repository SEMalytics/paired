#!/bin/bash

# WEE Dependency Installation Script
# Fixes Maya's identified issue: Missing dependency management system

set -e  # Exit on any error

echo "🔧 Installing WEE dependencies..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION+"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"

# Install npm dependencies
echo "📦 Installing npm packages..."
npm install --production

# Verify critical dependencies
echo "🔍 Verifying critical dependencies..."
CRITICAL_DEPS=("js-yaml" "chalk" "inquirer" "commander" "fs-extra" "@babel/parser" "@babel/traverse" "@babel/types" "uuid")

for dep in "${CRITICAL_DEPS[@]}"; do
    if npm list "$dep" &> /dev/null; then
        echo "✅ $dep: installed"
    else
        echo "❌ $dep: missing"
        echo "   Installing $dep..."
        npm install "$dep"
    fi
done

# Set executable permissions on scripts
echo "🔐 Setting executable permissions..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x bin/* 2>/dev/null || true

# Create necessary directories
echo "📁 Creating output directories..."
mkdir -p logs
mkdir -p diagrams
mkdir -p analysis
mkdir -p wee_analysis

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Validate installation: npm run validate"
echo "   2. Run health check: npm run health"
echo "   3. Quick start: npm run quickstart"
echo ""
