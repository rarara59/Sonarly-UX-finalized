// src/frameProcessors/detectPPG.ts
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';

// Safe lookup for plugin across VC versions
function getDetectPPGPlugin(): ((frame: Frame, options: Record<string, unknown>) => any) | null {
  try {
    if (VisionCameraProxy && typeof (VisionCameraProxy as any).getFrameProcessorPlugin === 'function') {
      const p = (VisionCameraProxy as any).getFrameProcessorPlugin('detectPPG');
      if (typeof p === 'function') return p as any;
    }
  } catch {}
  const FPP = (global as any)?.FrameProcessorPlugins;
  if (FPP && typeof FPP.detectPPG === 'function') return FPP.detectPPG;
  return null;
}

export function usePPG() {
  const lumaSV = useSharedValue(0);
  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';
    const plugin = getDetectPPGPlugin();
    if (!plugin) return;
    const result = plugin(frame, {});
    if (result && result.ok === true && typeof result.luma === 'number') {
      lumaSV.value = result.luma;
    }
  }, []);

  return { frameProcessor, lumaSV };
}
