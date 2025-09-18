# Sonarly VisionCamera Fix: Complete Step-by-Step Sequence

## Current Status
✅ **COMPLETED:** Native `PPGFrameProcessor.m` integrated into Xcode project  
❌ **REMAINING:** JavaScript frame processor implementation  
🎯 **GOAL:** Complete VisionCamera PPG heart rate detection system

---

## Step 1: Manual Verification (Do This First)

### 1.1 Verify Xcode Integration
```bash
# Open Xcode workspace
open ios/Sonarly.xcworkspace
```

### 1.2 Check in Xcode Interface
**In Xcode Navigator Panel:**
- Confirm `PPGFrameProcessor.m` appears under Sonarly folder
- File should be visible alongside `AppDelegate.mm` and other source files

**In Build Phases:**
- Select Sonarly target
- Go to Build Phases tab
- Click "Compile Sources" 
- Confirm `PPGFrameProcessor.m` is listed with checkbox checked

### 1.3 Test Clean Build
- **Clean Build Folder:** `Cmd+Shift+K`
- **Build Project:** `Cmd+B`
- **Look for:** "Compiling PPGFrameProcessor.m" in build output
- **Verify:** No compilation errors related to PPGFrameProcessor

### 1.4 Success Criteria for Step 1
✅ PPGFrameProcessor.m visible in Xcode Navigator  
✅ File included in Compile Sources build phase  
✅ Clean build completes without PPG-related errors  
✅ Build output shows "Compiling PPGFrameProcessor.m"

**If Step 1 fails, do not proceed to Claude Code prompts.**

---

## Step 2: Claude Code Implementation Sequence

### Prompt 2.1: Implement JavaScript Frame Processor Usage

```
Implement the missing JavaScript frame processor usage in BiometricCaptureScreen.js. The native "detectPPG" frame processor is registered but not being called from React Native.

Tasks:
1. Examine src/screens/BiometricCaptureScreen.js current implementation
2. Add the required imports:
   - useFrameProcessor from react-native-vision-camera
   - runOnJS from react-native-reanimated
3. Implement the frame processor that calls detectPPG
4. Add state management for PPG results (heart rate, debug data)
5. Add debug logging to verify frame processor is being called
6. Connect the frame processor to the existing Camera component

The frame processor should follow this pattern:
```javascript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';
  const result = detectPPG(frame);
  runOnJS(handlePPGData)(result);
}, []);
```

Add proper error handling and debug output to verify the integration works.
```

**Expected Output:** BiometricCaptureScreen.js updated with frame processor implementation

---

### Prompt 2.2: Test Frame Processor Registration

```
Verify that the frame processor is properly registered and callable from JavaScript.

1. Check that VisionCameraPluginRegistry.mm properly registers the detectPPG processor
2. Add console logging to verify the frame processor is being called
3. Build and run on simulator first to check for registration errors
4. Add JavaScript-side logging to see if frames are being processed
5. Test the complete flow: camera activation → frame processing → PPG data

Focus on getting debug logs to appear that show the frame processor is being invoked. Look for the native debug logs with emoji prefixes (🚀, ✅, 🔴, 📏, 📤).
```

**Expected Output:** Console logs showing frame processor being called

---

### Prompt 2.3: Build and Deploy to Device

```
Build and deploy the app to a physical iOS device to test PPG functionality. PPG detection requires physical device camera + flash.

1. Clean build folders: rm -rf ios/build ios/Pods ios/Podfile.lock
2. Reinstall pods: cd ios && pod install
3. Build in Xcode with proper code signing
4. Deploy to device and test camera + flash functionality
5. Monitor device logs for PPG frame processor debug messages
6. Test finger placement on camera to verify PPG signal detection

Ensure the build succeeds and the app runs with frame processing active on physical device.
```

**Expected Output:** App running on device with frame processor debug logs

---

### Prompt 2.4: PPG Algorithm Testing & Heart Rate Calculation

```
Once the frame processor is working and receiving camera frames, implement and test the actual PPG heart rate detection algorithm.

1. Verify brightness extraction from camera frames in PPGFrameProcessor.m
2. Add signal filtering and noise reduction to the native code
3. Implement peak detection algorithm for BPM calculation
4. Test accuracy with finger on camera + flash in various lighting
5. Add real-time BPM display and validation in React Native
6. Optimize algorithm for consistent heart rate readings

Focus on getting reliable, accurate heart rate readings from the camera PPG signal.
```

**Expected Output:** Working heart rate detection with BPM readings

---

## Debug Log Flow (Expected After Completion)

### Native iOS Logs (from PPGFrameProcessor.m)
```
🚀 PPGFrameProcessor loading and registering...
✅ PPG Frame processor registered as 'detectPPG'
🔴 PPG Frame processor called!
📏 Frame dimensions: 1920 x 1080
📤 Returning result: {bpm: 72, confidence: 0.85}
```

### JavaScript Logs (from BiometricCaptureScreen.js)
```
[PPG] Frame processor initialized
[PPG] Camera activated, starting frame processing
[PPG] Received PPG data: {bpm: 72, confidence: 0.85}
[PPG] Heart rate updated: 72 BPM
```

## Critical Requirements

### Physical Device Testing
- **PPG detection requires:** Camera + flash for blood volume measurement
- **Simulator won't work** for actual heart rate detection
- **Finger placement:** Cover camera lens and flash simultaneously

### Expected User Flow
1. User opens BiometricCaptureScreen
2. Places finger on camera + flash
3. Frame processor analyzes brightness changes
4. Algorithm detects heartbeat peaks
5. Real-time BPM display updates

## Troubleshooting Guide

### If Frame Processor Not Called
- Check `useFrameProcessor` implementation in JavaScript
- Verify Camera component has `frameProcessor` prop set
- Check console for worklet/reanimated errors

### If Native Logs Don't Appear
- Verify `detectPPG` is properly registered in VisionCameraPluginRegistry.mm
- Check device console logs (Xcode → Window → Devices and Simulators)
- Ensure app has camera permissions

### If PPG Algorithm Inaccurate
- Test in consistent lighting conditions
- Verify finger covers both camera and flash
- Check signal processing algorithm for noise filtering
- Adjust peak detection thresholds

## Success Criteria

### Immediate Success (After Prompts 2.1-2.3)
✅ Frame processor called from JavaScript  
✅ Native debug logs appearing  
✅ App builds and runs on device  
✅ Camera preview working with flash

### Full Success (After Prompt 2.4)
✅ Accurate heart rate detection  
✅ Real-time BPM display  
✅ Reliable PPG signal processing  
✅ End-to-end biometric capture flow working

## Project Context

- **Framework:** React Native Expo SDK 51
- **Camera System:** VisionCamera 4.7.0 with custom frame processor
- **Platform:** iOS 15.1+ (Android deferred post-MVP)
- **Architecture:** Native Objective-C frame processor → JavaScript bridge
- **Use Case:** Real-time heart rate detection for mood-based soundscapes

## Ready for Next Steps

1. **Complete Step 1 manual verification** 
2. **Run Prompt 2.1** with Claude Code to implement JavaScript side
3. **Continue sequentially** through remaining prompts
4. **Test on physical device** for actual PPG functionality

The hardest part (native module integration) is done - now it's connecting the pieces!