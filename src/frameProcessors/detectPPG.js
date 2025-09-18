import { VisionCameraProxy } from 'react-native-vision-camera';

let plugin = null;
try {
  if (VisionCameraProxy && typeof VisionCameraProxy.getFrameProcessorPlugin === 'function') {
    plugin = VisionCameraProxy.getFrameProcessorPlugin('detectPPG');
  }
} catch (_) {}

let warnedOnce = false;

// Detects PPG (photoplethysmography) data from a camera frame
// This is intended to be called from within a worklet (useFrameProcessor)
export function detectPPG(frame) {
  'worklet';
  if (!frame) return null;

  // Prefer module-scoped plugin fetched via VisionCameraProxy
  let p = plugin;
  // Fallback to global registry if available (compat across VC versions)
  if (!p) {
    const FPP = global && global.FrameProcessorPlugins ? global.FrameProcessorPlugins : null;
    if (FPP && typeof FPP.detectPPG === 'function') {
      p = FPP.detectPPG;
    }
  }

  if (typeof p !== 'function') {
    if (!warnedOnce) {
      // eslint-disable-next-line no-console
      console.warn('[PPG] Frame processor plugin not available. Ensure dev client is built with VisionCamera and the plugin.');
      warnedOnce = true;
    }
    return null;
  }

  try {
    // Call the native plugin (must pass serializable options object)
    return p(frame, {});
  } catch (_) {
    return null;
  }
}

// Expose for debugging if needed
// global.detectPPG = detectPPG;
