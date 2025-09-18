# Claude Code Prompt: Implement JavaScript PPG Worklet Integration

## Project Context
- **Project Path:** `/Users/rafaltracz/SonarlyApp2`
- **Goal:** Implement proper JavaScript worklet integration for PPG detection
- **Prerequisite:** Native PPGFrameProcessorPlugin.m must be implemented and compiling

## Task: Create JavaScript Worklet Integration with Exact Code

### 1. Create PPG Frame Processor Hook
Create `src/frameProcessors/detectPPG.ts` with this exact implementation:

```typescript
// src/frameProcessors/detectPPG.ts
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

export function usePPG() {
  const plugin = VisionCameraProxy.getFrameProcessorPlugin('detectPPG');
  const lumaSV = useSharedValue(0);

  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    if (!plugin) return;
    // Call native plugin; only serializable data comes back.
    const result = plugin(frame, {});
    if (result && result.ok === true && typeof result.luma === 'number') {
      lumaSV.value = result.luma;
      // If you need to log, forward only serializable values:
      // runOnJS(console.log)('PPG', result.luma, result.ts);
    }
  }, [plugin]);

  return { frameProcessor, lumaSV };
}
```

### 2. Update Biometric Capture Screen
Update `src/screens/BiometricCaptureScreen.tsx` to use the plugin:

```typescript
// src/screens/BiometricCaptureScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { usePPG } from '../frameProcessors/detectPPG';
import { useSharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';

export default function BiometricCaptureScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const { frameProcessor, lumaSV } = usePPG();
  const [lumaValue, setLumaValue] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);

  // Monitor luma changes and update UI
  useEffect(() => {
    const interval = setInterval(() => {
      setLumaValue(lumaSV.value);
    }, 100); // Update UI every 100ms

    return () => clearInterval(interval);
  }, [lumaSV]);

  const requestCameraPermission = async () => {
    const permission = await requestPermission();
    if (!permission) {
      Alert.alert(
        'Camera Permission Required',
        'This app needs camera access to detect your heart rate.',
        [{ text: 'OK' }]
      );
    }
  };

  const startCapture = () => {
    setIsCapturing(true);
  };

  const stopCapture = () => {
    setIsCapturing(false);
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required for heart rate detection
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No camera device found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isCapturing}
          torch="on"
          frameProcessor={frameProcessor}
          frameProcessorFps={30}
        />
        
        <View style={styles.overlay}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              PPG Detection Active
            </Text>
            <Text style={styles.lumaText}>
              Luma: {lumaValue.toFixed(1)}
            </Text>
            <Text style={styles.instructionText}>
              {isCapturing 
                ? "Place finger over camera lens" 
                : "Tap Start to begin detection"
              }
            </Text>
          </View>
          
          <View style={styles.controlsContainer}>
            {!isCapturing ? (
              <TouchableOpacity style={styles.startButton} onPress={startCapture}>
                <Text style={styles.startButtonText}>Start Detection</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopButton} onPress={stopCapture}>
                <Text style={styles.stopButtonText}>Stop Detection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
  },
  statusContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lumaText: {
    color: '#00ff00',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
```

### 3. Build and Test Sequence
Execute these commands in exact order:

```bash
# Clean previous build artifacts
rm -rf ios/Pods ios/Podfile.lock

# Regenerate iOS project with new native plugin
npx expo prebuild --clean --platform ios

# Install CocoaPods dependencies
cd ios && pod install && cd ..

# Deploy to physical device (required for camera testing)
npx react-native run-ios --device "iPhone (2)"
```

### 4. Verification Steps
After successful build and deployment:

1. **Grant camera permission** when prompted on device
2. **Tap "Start Detection"** button
3. **Verify torch activation** - camera flash should turn on
4. **Place finger over camera lens** covering both camera and flash
5. **Check console logs** for luma value changes
6. **Observe UI updates** - luma value should display in real-time

### 5. Success Criteria Checklist

#### Console Output Should Show:
- ✅ Native logs: `PPG meanLuma=XX.XX` (visible in Xcode console)
- ✅ No "frame: undefined" errors
- ✅ Luma values change when finger placement changes
- ✅ ~30 readings per second when detection is active

#### Device Behavior Should Show:
- ✅ Camera flash (torch) turns on during detection
- ✅ Luma value updates in real-time on screen
- ✅ Luma increases significantly (50+ points) when finger covers camera
- ✅ Luma decreases when finger is removed
- ✅ App remains responsive during frame processing

#### Expected Luma Value Ranges:
- **No finger:** 20-80 (varies by ambient light)
- **Finger on camera:** 100-200+ (torch illuminating finger)
- **Changes should be immediate and consistent**

### 6. Troubleshooting Common Issues

#### If luma values don't change:
- Verify torch is actually turning on (visible light)
- Check finger placement covers both camera and flash
- Ensure detection is started (button pressed)

#### If console shows plugin errors:
- Verify native plugin compiled successfully
- Check VISION_EXPORT_FRAME_PROCESSOR macro is present
- Confirm plugin name matches "detectPPG"

#### If build fails:
- Clean all build artifacts and retry
- Verify React Native and Expo versions are compatible
- Check iOS deployment target is 15.1+

## Expected Final Result
- **Functional frame data pipeline** from camera → native plugin → JavaScript
- **Real-time luma monitoring** with visual feedback
- **Responsive UI** showing live PPG signal strength
- **Foundation ready** for heart rate calculation algorithm implementation

## Next Steps After Success
1. Implement heart rate calculation from luma variations
2. Add signal quality assessment and filtering
3. Display calculated BPM in real-time
4. Integrate with existing Sonarly soundscape generation