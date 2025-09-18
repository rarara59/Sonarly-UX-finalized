# Sonarly VisionCamera Fix: Complete Step-by-Step Sequence

## Current Status
✅ **COMPLETED:** Native `PPGFrameProcessor.m` integrated into Xcode project  
❌ **REMAINING:** JavaScript frame processor implementation  
🎯 **GOAL:** Complete VisionCamera PPG heart rate detection system

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