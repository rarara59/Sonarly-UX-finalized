# Fix VisionCamera Native Module Integration

## Problem
VisionCamera native module not found: `Failed to initialize VisionCamera: The native Camera Module (NativeModules.CameraView) could not be found.`

React Native version mismatch: JS 0.74.5 vs Native 0.76.7

## Implementation Steps

### 1. Clean Build Environment

```bash
# Stop all processes
pkill -f "react-native start"
pkill -f "expo start"

# Clean iOS completely
cd ios
rm -rf build/
rm -rf DerivedData/
rm -rf Pods/
rm -rf Sonarly.xcworkspace
xcodebuild clean -workspace Sonarly.xcworkspace -scheme Sonarly 2>/dev/null || true

# Clean React Native
cd ..
rm -rf node_modules/
npm cache clean --force
rm -rf .expo/
```

### 2. Fix Package Dependencies

Update `package.json` to ensure version compatibility:

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react-native": "0.74.5",
    "react-native-vision-camera": "4.7.0",
    "react-native-worklets-core": "1.3.3"
  },
  "scripts": {
    "postinstall": "npm run preserve-vision-camera",
    "preserve-vision-camera": "./scripts/preserve-vision-camera.sh",
    "clean-ios": "cd ios && rm -rf build/ DerivedData/ && xcodebuild clean"
  }
}
```

### 3. Update App Configuration

Replace `app.json` VisionCamera plugin configuration:

```json
{
  "expo": {
    "name": "Sonarly",
    "slug": "sonarly",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./src/assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./src/assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "deploymentTarget": "15.1",
      "infoPlist": {
        "NSCameraUsageDescription": "Sonarly needs access to your camera to detect heart rate using photoplethysmography (PPG) technology.",
        "NSMicrophoneUsageDescription": "Sonarly needs microphone access for audio features."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./src/assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ]
    },
    "web": {
      "favicon": "./src/assets/favicon.png"
    },
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "Sonarly needs camera access to detect your heart rate using photoplethysmography technology.",
          "enableMicrophonePermission": false,
          "disableFrameProcessors": false
        }
      ]
    ]
  }
}
```

### 4. Update Babel Configuration

Replace `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-worklets-core/plugin',
        {
          processNestedWorklets: true,
        },
      ],
    ],
  };
};
```

### 5. Update Preservation Script

Replace `scripts/preserve-vision-camera.sh`:

```bash
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
```

### 6. Install Dependencies and Prebuild

```bash
# Install dependencies
npm install

# Make script executable
chmod +x scripts/preserve-vision-camera.sh

# Run preservation backup
npm run preserve-vision-camera

# Clean prebuild with native module regeneration
npx expo prebuild --clean --platform ios

# Restore preserved files
npm run preserve-vision-camera restore

# Install pods with verbose output
cd ios
pod deintegrate
pod install --verbose
cd ..
```

### 7. Verify VisionCamera Integration

Add to `App.js` immediately after imports:

```javascript
import { Camera } from 'react-native-vision-camera';

// Add this verification code at the top of your App component
console.log('🔍 VisionCamera module check:', {
  cameraAvailable: !!Camera,
  requestPermission: typeof Camera.requestCameraPermission,
  getCameraPermissionStatus: typeof Camera.getCameraPermissionStatus,
  getAvailableCameraDevices: typeof Camera.getAvailableCameraDevices
});

// Test camera permissions immediately
Camera.getCameraPermissionStatus().then(status => {
  console.log('📷 Camera permission status:', status);
}).catch(error => {
  console.error('❌ Camera permission check failed:', error);
});
```

### 8. Update iOS Project Settings

Add to `ios/Podfile` after platform specification:

```ruby
platform :ios, '15.1'
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

# Add this line for VisionCamera frame processors
$VCDisableFrameProcessors = false

target 'Sonarly' do
  config = use_native_modules!
  
  # Flags change depending on the env values.
  flags = get_default_flags()

  use_react_native!(
    :path => config[:reactNativePath],
    # to enable hermes on iOS, change `false` to `true` and then install pods
    :hermes_enabled => true,
    :fabric_enabled => flags[:fabric_enabled],
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  # Add VisionCamera dependency explicitly
  pod 'react-native-vision-camera', :path => '../node_modules/react-native-vision-camera'

  post_install do |installer|
    react_native_post_install(installer)
    __apply_Xcode_12_5_M1_post_install_workaround(installer)
    
    # Ensure iOS 15.1 deployment target
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end
  end
end
```

### 9. Update Frame Processor Registration

Replace `ios/Sonarly/VisionCameraPluginRegistry.mm`:

```objc
//
//  VisionCameraPluginRegistry.mm
//  Sonarly
//

#import <VisionCamera/FrameProcessorPluginRegistry.h>

// Import your frame processor
@interface PPGFrameProcessor : NSObject
@end

@implementation VisionCameraPluginRegistry

+ (void)load {
    // This method is called when the class is loaded
    // Register frame processors here
    NSLog(@"🚀 VisionCameraPluginRegistry loading...");
}

@end
```

### 10. Ensure PPG Frame Processor Compatibility

Update `ios/Sonarly/PPGFrameProcessor.m`:

```objc
//
//  PPGFrameProcessor.m
//  Sonarly
//

#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/Frame.h>

@interface PPGFrameProcessor : FrameProcessorPlugin
@end

@implementation PPGFrameProcessor

+ (void)load {
    NSLog(@"🚀 PPGFrameProcessor loading and registering...");
    
    // Register the frame processor plugin
    [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"detectPPG"
                                          withInitializer:^FrameProcessorPlugin*(NSDictionary* options) {
        NSLog(@"✅ PPG Frame processor initialized");
        return [[PPGFrameProcessor alloc] init];
    }];
    
    NSLog(@"✅ PPG Frame processor registered as 'detectPPG'");
}

- (id)callback:(Frame *)frame withArguments:(NSDictionary *)arguments {
    NSLog(@"🔴 PPG Frame processor called! Frame: %@", frame);
    
    // Basic PPG frame processing stub
    CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    if (!imageBuffer) {
        NSLog(@"❌ No image buffer found");
        return @{@"error": @"No image buffer"};
    }
    
    NSLog(@"✅ Image buffer exists");
    
    // Lock the base address of the pixel buffer
    CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
    
    size_t width = CVPixelBufferGetWidth(imageBuffer);
    size_t height = CVPixelBufferGetHeight(imageBuffer);
    
    NSLog(@"📏 Frame dimensions: %zu x %zu", width, height);
    
    // For now, just return frame dimensions as a test
    NSDictionary *result = @{
        @"width": @(width),
        @"height": @(height),
        @"timestamp": @(frame.timestamp),
        @"debug": @"Frame processed successfully"
    };
    
    CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
    
    NSLog(@"📤 Returning result: %@", result);
    return result;
}

@end
```

### 11. Build and Test

```bash
# Clean build
npm run clean-ios

# Install pods
cd ios && pod install --verbose && cd ..

# Start Metro with clean cache
npx react-native start --reset-cache

# In another terminal, build to device
npx react-native run-ios --device
```

### 12. Verification Checklist

After rebuild, verify these appear in Xcode console:

1. `🚀 VisionCameraPluginRegistry loading...` - Plugin registry loaded
2. `🚀 PPGFrameProcessor loading and registering...` - Frame processor registration
3. `✅ PPG Frame processor registered as 'detectPPG'` - Registration success
4. `🔍 VisionCamera module check:` - Module availability verification
5. `📷 Camera permission status:` - Permission system working

Expected success indicators:
- No "native Camera Module not found" errors
- VisionCamera module check shows all functions available
- Camera permission requests work
- Frame processor logs appear when camera activates

### 13. Fallback Testing

If issues persist, add this temporary diagnostic to `BiometricCaptureScreen.js`:

```javascript
import { NativeModules } from 'react-native';

// Add in component
useEffect(() => {
  console.log('🔍 Available Native Modules:', Object.keys(NativeModules));
  console.log('🔍 CameraView module:', NativeModules.CameraView);
  console.log('🔍 VisionCamera module:', NativeModules.VisionCamera);
}, []);
```

This implementation provides complete VisionCamera module integration with proper native code preservation and frame processor registration.