# Sonarly VisionCamera Fix: Complete Step-by-Step Sequence

## Current Status
✅ **COMPLETED:** Native `PPGFrameProcessor.m` integrated into Xcode project  
❌ **REMAINING:** JavaScript frame processor implementation  
🎯 **GOAL:** Complete VisionCamera PPG heart rate detection system

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
