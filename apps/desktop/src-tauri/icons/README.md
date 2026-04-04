# App Icon Guide

## Current Design

The app icon is designed as an SVG file at `src-tauri/icons/icon.svg`. The design features:
- **Background**: Indigo (#4f46e5) rounded square
- **Book Icon**: Open book with white pages
- **AI Sparkle**: Golden accent representing AI features

## Required Icon Files

For Tauri apps, you need these icon sizes:

| File | Size | Purpose |
|------|------|---------|
| `32x32.png` | 32×32 | System tray, small UI elements |
| `128x128.png` | 128×128 | App icon (standard DPI) |
| `128x128@2x.png` | 256×256 | App icon (high DPI) |
| `icon.ico` | Multiple | Windows app icon |
| `icon.icns` | Multiple | macOS app icon |

## Generating Icons

### Option 1: Using Tauri CLI

```bash
cd apps/desktop
pnpm tauri icon src-tauri/icons/icon.svg
```

This command automatically generates all required icon sizes from the SVG.

### Option 2: Using ImageMagick

```bash
# Generate PNG files
convert icon.svg -resize 32x32 32x32.png
convert icon.svg -resize 128x128 128x128.png
convert icon.svg -resize 256x256 128x128@2x.png

# Generate ICO for Windows
convert icon.svg -resize 256x256 -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Generate ICNS for macOS (requires png2icns)
png2icns icon.icns 128x128.png 128x128@2x.png
```

### Option 3: Online Tools

1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload the SVG file
3. Configure for desktop app icons
4. Download and extract to `icons/` directory

## Icon Design Guidelines

### Visual Requirements
- Simple, recognizable at small sizes
- Works in both light and dark backgrounds
- Clear silhouette
- Consistent with app branding

### Technical Requirements
- Square aspect ratio (1:1)
- PNG format with alpha channel
- Minimum resolution: 512×512 for source
- ICO: Multiple sizes for Windows
- ICNS: Multiple sizes for macOS

## Current Status

The PNG icon files currently exist but may be placeholders. To regenerate:

```bash
# Navigate to icons directory
cd apps/desktop/src-tauri/icons

# Run Tauri icon generator
pnpm tauri icon icon.svg
```

This will create all required icon files from the SVG source.