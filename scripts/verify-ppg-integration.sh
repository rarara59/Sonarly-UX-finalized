#!/bin/bash

echo "🔍 Verifying PPGFrameProcessor.m Integration in Xcode Project"
echo "=============================================================="

PROJECT_FILE="ios/Sonarly.xcodeproj/project.pbxproj"
PPG_FILE="ios/Sonarly/PPGFrameProcessor.m"

# Check if PPGFrameProcessor.m file exists
if [ -f "$PPG_FILE" ]; then
    echo "✅ PPGFrameProcessor.m file exists at: $PPG_FILE"
else
    echo "❌ PPGFrameProcessor.m file NOT found at: $PPG_FILE"
    exit 1
fi

# Count references in project.pbxproj
COUNT=$(grep -c "PPGFrameProcessor" "$PROJECT_FILE")
echo ""
echo "📊 Found $COUNT references to PPGFrameProcessor in project.pbxproj"

if [ "$COUNT" -eq 0 ]; then
    echo "❌ PPGFrameProcessor.m is NOT added to the Xcode project"
    exit 1
elif [ "$COUNT" -lt 4 ]; then
    echo "⚠️  PPGFrameProcessor.m may be partially added (expected 4 references, found $COUNT)"
else
    echo "✅ PPGFrameProcessor.m appears to be properly added"
fi

echo ""
echo "📋 Checking specific integrations:"
echo ""

# Check PBXBuildFile section
if grep -q "PPGFrameProcessor.m in Sources" "$PROJECT_FILE"; then
    echo "✅ Found in PBXBuildFile section (will be compiled)"
    grep "PPGFrameProcessor.m in Sources" "$PROJECT_FILE" | head -1
else
    echo "❌ NOT found in PBXBuildFile section"
fi

echo ""

# Check PBXFileReference section
if grep -q "PPGFrameProcessor.m.*PBXFileReference" "$PROJECT_FILE"; then
    echo "✅ Found in PBXFileReference section (file reference exists)"
    grep "PPGFrameProcessor.m.*{" "$PROJECT_FILE" | head -1
else
    echo "❌ NOT found in PBXFileReference section"
fi

echo ""

# Check if it's in the Sources build phase
if grep -B5 -A5 "PPGFrameProcessor.m in Sources" "$PROJECT_FILE" | grep -q "isa = PBXSourcesBuildPhase"; then
    echo "✅ Found in Sources build phase (will be compiled with target)"
else
    echo "⚠️  May not be in Sources build phase"
fi

echo ""

# Check if it appears alongside AppDelegate.mm
if grep -A2 "AppDelegate.mm" "$PROJECT_FILE" | grep -q "PPGFrameProcessor"; then
    echo "✅ PPGFrameProcessor.m is listed with other source files"
else
    echo "⚠️  PPGFrameProcessor.m not found near AppDelegate.mm"
fi

echo ""
echo "=============================================================="
echo "📱 Next Steps:"
echo ""
echo "1. Open Xcode: open ios/Sonarly.xcworkspace"
echo "2. Clean Build Folder: Cmd+Shift+K"
echo "3. Build Project: Cmd+B"
echo "4. Check that PPGFrameProcessor.m appears in:"
echo "   - Navigator panel under Sonarly folder"
echo "   - Build Phases > Compile Sources"
echo ""
echo "If the file doesn't appear in Xcode after cleaning:"
echo "  - Close Xcode completely"
echo "  - Run: cd ios && pod deintegrate && pod install"
echo "  - Open Xcode again"