#!/bin/bash

# Workspace File Groups - Release Script
# This script packages the already-built plugin for distribution

set -e

echo "📦 Packaging Workspace File Groups plugin for release..."

# Check and install required tools
if ! command -v zip &> /dev/null; then
    echo "📦 Installing zip utility..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y zip
    elif command -v yum &> /dev/null; then
        sudo yum install -y zip
    elif command -v brew &> /dev/null; then
        brew install zip
    else
        echo "⚠️  Could not install zip automatically. Please install zip manually."
        echo "   On Ubuntu/Debian: sudo apt-get install zip"
        echo "   On CentOS/RHEL: sudo yum install zip" 
        echo "   On macOS: brew install zip"
        exit 1
    fi
fi

# Get version
VERSION=$(node -p "require('./package.json').version")
PLUGIN_DIR="dist/workspace-filegroups-$VERSION"

# Verify build files exist
if [ ! -f "$PLUGIN_DIR/main.js" ] || [ ! -f "$PLUGIN_DIR/manifest.json" ] || [ ! -f "$PLUGIN_DIR/styles.css" ]; then
    echo "❌ Build files not found in $PLUGIN_DIR!"
    echo "   Make sure the production build completed successfully."
    exit 1
fi

echo "📦 Creating archives for version $VERSION..."

# Create archives directly from the built folder
cd dist
tar -czf "workspace-filegroups-$VERSION.tar.gz" "workspace-filegroups-$VERSION/"
zip -r "workspace-filegroups-$VERSION.zip" "workspace-filegroups-$VERSION/"
cd ..

echo ""
echo "✅ Release packaging complete!"
echo "📁 Files created:"
echo "   • $PLUGIN_DIR/"
echo "   • dist/workspace-filegroups-$VERSION.tar.gz"  
echo "   • dist/workspace-filegroups-$VERSION.zip"
echo ""
echo "💡 For manual installation:"
echo "   1. Extract any of the archives"
echo "   2. Copy the folder to: [vault]/.obsidian/plugins/"
echo "   3. Enable the plugin in Obsidian settings"
echo "" 