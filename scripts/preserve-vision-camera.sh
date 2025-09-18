#!/bin/bash

set -e

echo "🔄 Preserving VisionCamera native files..."

# Create backup directory
BACKUP_DIR="./ios_native_backup"
mkdir -p "$BACKUP_DIR"

# Files to preserve
FILES_TO_PRESERVE=(
    "ios/Sonarly/PPGFrameProcessor.m"
    "ios/Sonarly/VisionCameraPluginRegistry.mm"
    "ios/Sonarly/fix_unsigned_char_traits.h"
    "ios/Sonarly/Sonarly-Bridging-Header.h"
)

# Backup existing files
for file in "${FILES_TO_PRESERVE[@]}"; do
    if [ -f "$file" ]; then
        echo "📦 Backing up $file"
        cp "$file" "$BACKUP_DIR/$(basename "$file")"
    fi
done

echo "✅ Backup complete"

# Function to restore files after prebuild
restore_files() {
    echo "🔄 Restoring preserved files..."
    
    for file in "${FILES_TO_PRESERVE[@]}"; do
        backup_file="$BACKUP_DIR/$(basename "$file")"
        if [ -f "$backup_file" ]; then
            echo "📤 Restoring $file"
            mkdir -p "$(dirname "$file")"
            cp "$backup_file" "$file"
        fi
    done
    
    echo "✅ Files restored"
}

# If this script is called with 'restore' argument, restore files
if [ "$1" = "restore" ]; then
    restore_files
    exit 0
fi

echo "💡 Run 'npm run preserve-vision-camera restore' after prebuild to restore files"