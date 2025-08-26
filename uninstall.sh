#!/bin/bash

# PAIRED Uninstall Script (Root Directory)
# Completely removes PAIRED from the system
# This is a convenience copy of the main uninstall script for easy access

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🗑️  PAIRED Uninstall Script${NC}"
echo -e "${YELLOW}This will completely remove PAIRED from your system${NC}"
echo ""

# Confirm uninstall
read -p "Are you sure you want to uninstall PAIRED? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Uninstall cancelled${NC}"
    exit 0
fi

echo -e "${YELLOW}🧹 Starting PAIRED uninstall...${NC}"

# Stop any running PAIRED processes
echo -e "${BLUE}🛑 Stopping PAIRED processes...${NC}"
pkill -f "paired" 2>/dev/null || true
pkill -f "cascade" 2>/dev/null || true

# Remove global PAIRED directory
if [ -d "$HOME/.paired" ]; then
    echo -e "${BLUE}📁 Removing global PAIRED directory...${NC}"
    rm -rf "$HOME/.paired"
    echo -e "${GREEN}✅ Removed ~/.paired${NC}"
fi

# Remove shell configuration
echo -e "${BLUE}🐚 Cleaning shell configuration...${NC}"

# Remove from .zshrc
if [ -f "$HOME/.zshrc" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '/# PAIRED/,/^$/d' "$HOME/.zshrc" 2>/dev/null || true
        sed -i '' '/source.*\.paired/d' "$HOME/.zshrc" 2>/dev/null || true
    else
        sed -i '/# PAIRED/,/^$/d' "$HOME/.zshrc" 2>/dev/null || true
        sed -i '/source.*\.paired/d' "$HOME/.zshrc" 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Cleaned .zshrc${NC}"
fi

# Remove from .bashrc
if [ -f "$HOME/.bashrc" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '/# PAIRED/,/^$/d' "$HOME/.bashrc" 2>/dev/null || true
        sed -i '' '/source.*\.paired/d' "$HOME/.bashrc" 2>/dev/null || true
    else
        sed -i '/# PAIRED/,/^$/d' "$HOME/.bashrc" 2>/dev/null || true
        sed -i '/source.*\.paired/d' "$HOME/.bashrc" 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Cleaned .bashrc${NC}"
fi

# Remove from .profile
if [ -f "$HOME/.profile" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' '/# PAIRED/,/^$/d' "$HOME/.profile" 2>/dev/null || true
        sed -i '' '/source.*\.paired/d' "$HOME/.profile" 2>/dev/null || true
    else
        sed -i '/# PAIRED/,/^$/d' "$HOME/.profile" 2>/dev/null || true
        sed -i '/source.*\.paired/d' "$HOME/.profile" 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Cleaned .profile${NC}"
fi

# Remove project .paired directories (optional)
echo ""
read -p "Remove .paired directories from all projects? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧹 Searching for project .paired directories...${NC}"
    find "$HOME" -type d -name ".paired" -not -path "$HOME/.paired" 2>/dev/null | while read -r dir; do
        echo -e "${YELLOW}Found: $dir${NC}"
        rm -rf "$dir"
        echo -e "${GREEN}✅ Removed $dir${NC}"
    done
fi

# Remove .pairedrules and .windsurfrules files (optional)
echo ""
read -p "Remove .pairedrules and .windsurfrules files from projects? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧹 Searching for PAIRED rule files...${NC}"
    find "$HOME" -name ".pairedrules" -o -name ".windsurfrules" 2>/dev/null | while read -r file; do
        echo -e "${YELLOW}Found: $file${NC}"
        rm -f "$file"
        echo -e "${GREEN}✅ Removed $file${NC}"
    done
fi

echo ""
echo -e "${GREEN}🎉 PAIRED has been completely uninstalled!${NC}"
echo -e "${BLUE}💡 You may need to restart your terminal or run 'source ~/.zshrc' to update your shell${NC}"
echo ""
echo -e "${YELLOW}Thank you for using PAIRED! 👋${NC}"
