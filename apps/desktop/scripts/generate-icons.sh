#!/bin/bash
# Generate icons for Tauri desktop app
# This script creates placeholder icons if ImageMagick is available

ICONS_DIR="apps/desktop/src-tauri/icons"
SVG_FILE="$ICONS_DIR/icon.svg"

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

echo "Generating icons for AI读 desktop app..."

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate PNG and ICO files..."

    # Generate PNG files from SVG
    convert -background none -resize 32x32 "$SVG_FILE" "$ICONS_DIR/32x32.png" 2>/dev/null || echo "Warning: Could not generate 32x32.png"
    convert -background none -resize 128x128 "$SVG_FILE" "$ICONS_DIR/128x128.png" 2>/dev/null || echo "Warning: Could not generate 128x128.png"
    convert -background none -resize 256x256 "$SVG_FILE" "$ICONS_DIR/128x128@2x.png" 2>/dev/null || echo "Warning: Could not generate 128x128@2x.png"

    # Generate ICO file for Windows
    convert -background none -resize 256x256 "$SVG_FILE" "$ICONS_DIR/icon.ico" 2>/dev/null || echo "Warning: Could not generate icon.ico"

    # Generate ICNS file for macOS (requires intermediate steps)
    mkdir -p "$ICONS_DIR/icon.iconset"
    convert -background none -resize 16x16 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_16x16.png" 2>/dev/null
    convert -background none -resize 32x32 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_16x16@2x.png" 2>/dev/null
    convert -background none -resize 32x32 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_32x32.png" 2>/dev/null
    convert -background none -resize 64x64 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_32x32@2x.png" 2>/dev/null
    convert -background none -resize 128x128 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_128x128.png" 2>/dev/null
    convert -background none -resize 256x256 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_128x128@2x.png" 2>/dev/null
    convert -background none -resize 256x256 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_256x256.png" 2>/dev/null
    convert -background none -resize 512x512 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_256x256@2x.png" 2>/dev/null
    convert -background none -resize 512x512 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_512x512.png" 2>/dev/null
    convert -background none -resize 1024x1024 "$SVG_FILE" "$ICONS_DIR/icon.iconset/icon_512x512@2x.png" 2>/dev/null

    # Create icns using iconutil (macOS only)
    if command -v iconutil &> /dev/null; then
        iconutil -c icns "$ICONS_DIR/icon.iconset" -o "$ICONS_DIR/icon.icns" 2>/dev/null || echo "Warning: Could not generate icon.icns"
        rm -rf "$ICONS_DIR/icon.iconset"
    else
        echo "Note: iconutil not found (not macOS). Skipping .icns generation."
    fi

    echo "Icon generation complete!"
else
    echo "ImageMagick not found. Creating placeholder icons..."

    # Create simple placeholder PNG files using base64
    # This is a minimal 32x32 purple square PNG
    PLACEHOLDER_PNG="iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADUSURBVFiF7ZY9CsJAEIW/J7FYLBZzsVhsYrEoxMJCcAEvwcJCcAEH4yW4ChvBwlcghVWwgZ8FJGzAhbAQ3ATvQcKMIUjoTdzMvJk5M0IwdZ1hYAgewBtwAN6AK2AR3FISEqME7ANnwAFwBMdgN4WQArjZBK7gBVyBK7ADvG0CV+AKvEEpOE0CeJNgpgnsxQlY/D4gBveSgJ1CgF6SgJ0mgF2SgL0mgFWSgLkmwC5JwF6TwC5JwHRTwBokYKcJYE0CdhICdiIBuycBux4BXJGA3ZGA3ZKA3ZOA3ZOAnZKAnZGAXZKAXZCAnZKAXY+ArkjAbkrArkjAbknAbkrArkjArknAbkvAbkuA7y6B+xRgZwA3C/jfE+DbLHDvCeC2B9xbALjNAfP9Fzu+OQJWYwLWMQKrMQGrMYErOIGLX3kFlXECl3DxK66B9jV8AnMJ3MUI7MUIrMUIbMUIHMUIvMUIgsUQ0cUQkMUQcMQQaMIQGMQQKMQQGMQQCMQQCMQSyMQUyMQSyMQBCMQR8MQCCMQSiMQSCMQdCMQdCMQNCMQRiMQRhMQRSMQRyMQRWMQR2MQRmMQRuMQBlMQJlMQKVMQJVMQK1MQJ1MQLlMQL1MQL9MQIDMQITMQKzMQLdMQJTMQKTGApDGApTGA5TGA1jGA1zGAzzGA7zGA8DGE4DGE8DGFIDGFIDGFYDGFkDGFsDGFwDGF0DGF4DGF8DGKADGKEDGKIDGKMDGAQEGAAFJVz7n9gAAAABJRU5ErkJggg=="

    echo "$PLACEHOLDER_PNG" | base64 -d > "$ICONS_DIR/32x32.png" 2>/dev/null
    echo "$PLACEHOLDER_PNG" | base64 -d > "$ICONS_DIR/128x128.png" 2>/dev/null
    echo "$PLACEHOLDER_PNG" | base64 -d > "$ICONS_DIR/128x128@2x.png" 2>/dev/null

    echo "Placeholder icons created. For better icons, install ImageMagick:"
    echo "  macOS: brew install imagemagick"
    echo "  Linux: apt-get install imagemagick"
    echo "  Windows: choco install imagemagick"
fi

echo ""
echo "Icon files location: $ICONS_DIR"
ls -la "$ICONS_DIR"