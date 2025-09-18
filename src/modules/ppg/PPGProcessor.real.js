// src/modules/ppg/PPGProcessor.real.js - Real Version with VisionCamera
import { useCallback, useRef, useEffect } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';

// Import the frame processor
import { detectPPG } from '../../frameProcessors/detectPPG';

const DEBUG_PPG = false;
if (DEBUG_PPG) {
  // eslint-disable-next-line no-console
  console.log('✅ PPG Frame Processor loaded in REAL mode with native processing');
}

/**
 * Custom hook to process frames for PPG data extraction
 * @param {Function} onFrameProcessed - Callback to receive processed frame data
 * @param {Function} onError - Optional callback for error handling
 * @param {boolean} isActive - Whether frame processing is active
 * @returns {Function} - Frame processor function for use with Camera
 */
export function usePPGFrameProcessor(onFrameProcessed, onError, isActive = true) {
  // Keep track of latest callbacks
  const onErrorRef = useRef(onError);
  const onFrameProcessedRef = useRef(onFrameProcessed);
  const frameCountRef = useRef(0);
  
  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onFrameProcessedRef.current = onFrameProcessed;
  }, [onError, onFrameProcessed]);
  
  // Create error handler that runs on JS thread
  const handleError = useCallback((errorMessage) => {
    'worklet';
    if (DEBUG_PPG) {
      // eslint-disable-next-line no-console
      console.log('[PPG Error]', errorMessage);
    }
    if (onErrorRef.current) {
      runOnJS(onErrorRef.current)(errorMessage);
    }
  }, []);
  
  // Create frame data handler that runs on JS thread
  const processFrameData = useCallback((frameData) => {
    'worklet';
    if (DEBUG_PPG) {
      // eslint-disable-next-line no-console
      console.log('[PPG Frame Data]', frameData);
    }
    if (onFrameProcessedRef.current) {
      runOnJS(onFrameProcessedRef.current)(frameData);
    }
  }, []);
  
  // Create the actual frame processor using Vision Camera's hook
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (!isActive) {
      return;
    }
    
    // Increment frame counter
    frameCountRef.current++;
    
    // Process every frame for real-time PPG
    try {
      if (DEBUG_PPG) {
        // eslint-disable-next-line no-console
        console.log('🎯 Processing frame #', frameCountRef.current);
      }
      
      // Call the native PPG detection
      const result = detectPPG(frame);
      
      if (result) {
        if (result.error) {
          handleError(result.error);
        } else {
          processFrameData(result);
        }
      }
    } catch (error) {
      if (DEBUG_PPG) {
        // eslint-disable-next-line no-console
        console.error('❌ Frame processor error:', error);
      }
      handleError(error.message || 'Frame processing failed');
    }
  }, [isActive, handleError, processFrameData]);
  
  return frameProcessor;
}

/**
 * Utility functions for PPG data processing
 */
export const PPGUtils = {
  /**
   * Calculate signal-to-noise ratio (SNR) from a window of PPG values
   * @param {Array} values - Array of PPG intensity values
   * @returns {number} SNR value in dB
   */
  calculateSNR: (values) => {
    if (!values || values.length < 10) return 0;
    
    // Calculate mean
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation (noise)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate peak-to-peak amplitude (signal)
    const min = Math.min(...values);
    const max = Math.max(...values);
    const amplitude = max - min;
    
    // SNR in dB
    if (stdDev === 0) return 0;
    const snr = 20 * Math.log10(amplitude / stdDev);
    
    return Math.max(0, snr);
  },
  
  /**
   * Calculate perfusion index
   * @param {Array} values - Array of PPG intensity values
   * @returns {number} Perfusion index (%)
   */
  calculatePerfusionIndex: (values) => {
    if (!values || values.length < 10) return 0;
    
    // Calculate AC (pulsatile) and DC (non-pulsatile) components
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    const ac = max - min; // Pulsatile component
    const dc = mean; // Non-pulsatile component
    
    if (dc === 0) return 0;
    
    // Perfusion Index = (AC / DC) * 100
    const pi = (ac / dc) * 100;
    
    return Math.min(20, Math.max(0, pi)); // Cap at 20%
  },
  
  /**
   * Check for motion artifacts
   * @param {Array} values - Array of PPG intensity values
   * @returns {boolean} True if motion artifacts detected
   */
  hasMotionArtifacts: (values) => {
    if (!values || values.length < 10) return true;
    
    // Calculate successive differences
    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(Math.abs(values[i] - values[i-1]));
    }
    
    // Check for sudden jumps (motion artifacts)
    const meanDiff = diffs.reduce((sum, val) => sum + val, 0) / diffs.length;
    const maxDiff = Math.max(...diffs);
    
    // Motion detected if max difference is > 5x the mean difference
    return maxDiff > meanDiff * 5;
  },
  
  /**
   * Check if signal quality is good enough for heart rate detection
   * @param {Object} data - Frame data from native processor
   * @param {Array} recentValues - Recent signal values
   * @param {Object} options - Configuration options
   * @returns {Object} Validation result
   */
  validateSignal: (data, recentValues = [], options = {}) => {
    const {
      minSNR = 3,
      minPerfusion = 0.5,
      minValues = 30
    } = options;
    
    // Check if we have enough data
    if (recentValues.length < minValues) {
      return {
        isValid: false,
        reason: 'Insufficient data',
        metrics: {}
      };
    }
    
    // Use native signal quality if available
    if (data && data.signalQuality !== undefined) {
      const isValid = data.signalQuality > 0.3;
      return {
        isValid,
        reason: isValid ? 'Good signal' : 'Poor signal quality',
        metrics: {
          quality: data.signalQuality,
          bpm: data.bpm || 0
        }
      };
    }
    
    // Fallback to calculated metrics
    const snr = PPGUtils.calculateSNR(recentValues);
    const perfusion = PPGUtils.calculatePerfusionIndex(recentValues);
    const hasMotion = PPGUtils.hasMotionArtifacts(recentValues);
    
    let reason = 'Good signal';
    let isValid = true;
    
    if (hasMotion) {
      isValid = false;
      reason = 'Motion detected';
    } else if (snr < minSNR) {
      isValid = false;
      reason = 'Low signal-to-noise ratio';
    } else if (perfusion < minPerfusion) {
      isValid = false;
      reason = 'Low perfusion';
    }
    
    return {
      isValid,
      reason,
      metrics: {
        snr,
        perfusion,
        hasMotion
      }
    };
  },
  
  /**
   * Get user-friendly feedback for finger placement
   * @param {Object} data - Frame data from native processor
   * @param {Array} recentValues - Recent signal values
   * @returns {string} User feedback message
   */
  getFingerPlacementFeedback: (data, recentValues = []) => {
    // Use native signal quality if available
    if (data && data.signalQuality !== undefined) {
      if (data.isCalibrating) {
        return `Calibrating... ${Math.round((data.progress || 0) * 100)}%`;
      }
      
      if (data.signalQuality < 0.2) {
        return "No finger detected - place finger on camera";
      } else if (data.signalQuality < 0.4) {
        return "Weak signal - press gently and hold steady";
      } else if (data.signalQuality < 0.6) {
        return "Fair signal - keep finger steady";
      } else {
        return data.bpm > 0 ? `Good signal - HR: ${Math.round(data.bpm)} BPM` : "Good signal - detecting pulse...";
      }
    }
    
    // Fallback validation
    const validation = PPGUtils.validateSignal(data, recentValues);
    
    if (!validation.isValid) {
      switch (validation.reason) {
        case 'Insufficient data':
          return "Place finger on camera and hold steady";
        case 'Motion detected':
          return "Motion detected - hold finger steady";
        case 'Low signal-to-noise ratio':
          return "Weak signal - adjust finger position";
        case 'Low perfusion':
          return "Poor blood flow - press gently";
        default:
          return validation.reason;
      }
    }
    
    return "Good signal - detecting heart rate...";
  }
};
