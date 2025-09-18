import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
// Correct import path from src/components/ to src/modules/ppg/
import { usePPGFrameProcessor, PPGUtils } from '../modules/ppg/PPGProcessor';

export default function HeartRateDetector({ onHeartRateDetected, isCapturing, onProgress }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [signalQuality, setSignalQuality] = useState('Waiting...');
  const [captureError, setCaptureError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [captureState, setCaptureState] = useState('idle');

  const recoveryTimerRef = useRef(null);
  const maxRetries = 3;
  const baseRetryDelay = 1000;
  
  const device = useCameraDevice('back');
  const { hasPermission: cameraPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef(null);
  
  // Keep recent values for PPG processing
  const recentValuesRef = useRef([]);
  
  // Processing interval reference
  const processingTimerRef = useRef(null);
  const torchTimerRef = useRef(null);

  // ========================================
  // STABLE UTILITY FUNCTIONS (NO DEPENDENCIES)
  // ========================================

  // Log important events for debugging
  const logEvent = useCallback((message) => {
    console.log(message);
    setDebugInfo(prev => message + '\n' + prev.substring(0, 200));
  }, []); // No dependencies

  // Signal processing utilities - pure functions
  const movingAverage = useCallback((values, windowSize) => {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += values[j];
        count++;
      }
      result.push(sum / count);
    }
    return result;
  }, []); // Pure function, no dependencies

  // Detrending function - pure function
  const detrendSignal = useCallback((values, windowSize = 15) => {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const window = values.slice(Math.max(0, i - windowSize), i + 1);
      const sorted = [...window].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      result.push(values[i] - median);
    }
    return result;
  }, []); // Pure function

  // Prominence calculation - pure function
  const calculateProminence = useCallback((values, index) => {
    const window = 10;
    const left = values.slice(Math.max(0, index - window), index);
    const right = values.slice(index + 1, index + 1 + window);
    const leftMin = left.length > 0 ? Math.min(...left) : values[index];
    const rightMin = right.length > 0 ? Math.min(...right) : values[index];
    const minSurround = Math.min(leftMin, rightMin);
    return values[index] - minSurround;
  }, []); // Pure function

  // Filter design functions - pure functions
  const designHighPassBiquad = useCallback((cutoffNormalized, q) => {
    const omega = Math.PI * cutoffNormalized;
    const alpha = Math.sin(omega) / (2 * q);
    const cosw = Math.cos(omega);
    
    const b0 = (1 + cosw) / 2;
    const b1 = -(1 + cosw);
    const b2 = (1 + cosw) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosw;
    const a2 = 1 - alpha;
    
    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }, []); // Pure function

  const designLowPassBiquad = useCallback((cutoffNormalized, q) => {
    const omega = Math.PI * cutoffNormalized;
    const alpha = Math.sin(omega) / (2 * q);
    const cosw = Math.cos(omega);
    
    const b0 = (1 - cosw) / 2;
    const b1 = 1 - cosw;
    const b2 = (1 - cosw) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosw;
    const a2 = 1 - alpha;
    
    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }, []); // Pure function

  const applyBiquadSection = useCallback((values, coeffs) => {
    const { b0, b1, b2, a1, a2 } = coeffs;
    const output = [];
    
    let x1 = 0, x2 = 0;
    let y1 = 0, y2 = 0;
    
    for (let i = 0; i < values.length; i++) {
      const x0 = values[i];
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      
      output.push(y0);
      
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    
    return output;
  }, []); // Pure function

  // ========================================
  // COMPOSITE FUNCTIONS (MINIMAL DEPENDENCIES)
  // ========================================

  const applyBiquadFilter = useCallback((values, filterSections) => {
    if (!values || values.length === 0) return [];
    
    let output = [...values];
    
    for (const section of filterSections) {
      output = applyBiquadSection(output, section);
    }
    
    return output;
  }, [applyBiquadSection]); // Only depends on pure function

  const designHighPassFilter = useCallback((cutoffNormalized) => {
    const q1 = 0.7654;
    const q2 = 1.8478;
    
    const section1 = designHighPassBiquad(cutoffNormalized, q1);
    const section2 = designHighPassBiquad(cutoffNormalized, q2);
    
    return [section1, section2];
  }, [designHighPassBiquad]); // Only depends on pure function

  const designLowPassFilter = useCallback((cutoffNormalized) => {
    const q1 = 0.7654;
    const q2 = 1.8478;
    
    const section1 = designLowPassBiquad(cutoffNormalized, q1);
    const section2 = designLowPassBiquad(cutoffNormalized, q2);
    
    return [section1, section2];
  }, [designLowPassBiquad]); // Only depends on pure function

  const bandpassFilter = useCallback((values, lowCutoff, highCutoff, sampleRate) => {
    if (!values || values.length === 0) return [];
    if (lowCutoff >= highCutoff) return values;
    
    const nyquist = sampleRate / 2;
    const lowWn = lowCutoff / nyquist;
    const highWn = highCutoff / nyquist;
    
    if (lowWn <= 0 || highWn >= 1) {
      console.warn("Invalid filter frequencies");
      return values;
    }
    
    const highPassCoeffs = designHighPassFilter(lowWn);
    const lowPassCoeffs = designLowPassFilter(highWn);
    
    let highPassOutput = applyBiquadFilter(values, highPassCoeffs);
    let output = applyBiquadFilter(highPassOutput, lowPassCoeffs);
    
    return output;
  }, [designHighPassFilter, designLowPassFilter, applyBiquadFilter]);

  const findPeaks = useCallback((values, minDistance = 10) => {
    if (!values || values.length < 3) return [];

    const peaks = [];

    // Signal stats
    let sum = 0;
    let sumSquares = 0;
    let min = Infinity;
    let max = -Infinity;

    for (const value of values) {
      sum += value;
      sumSquares += value * value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }

    const mean = sum / values.length;
    const variance = (sumSquares / values.length) - (mean * mean);
    const stdDev = Math.sqrt(variance);
    const range = max - min;

    // Dynamic thresholding
    let baseThreshold;
    if (range > 10 * stdDev) {
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      baseThreshold = median + range * 0.3;
    } else {
      baseThreshold = mean + stdDev * 1.5;
    }

    let adaptiveThreshold = baseThreshold;
    const potentialPeaks = [];

    for (let i = 1; i < values.length - 1; i++) {
      const prev = values[i - 1];
      const curr = values[i];
      const next = values[i + 1];

      const localLevel = (prev + curr + next) / 3;
      adaptiveThreshold = adaptiveThreshold * 0.95 + (localLevel + stdDev) * 0.05;

      if (curr > prev && curr > next && curr > adaptiveThreshold) {
        potentialPeaks.push({
          index: i,
          value: curr,
          prominence: calculateProminence(values, i)
        });
      }
    }

    if (potentialPeaks.length === 0) return [];

    potentialPeaks.sort((a, b) => b.prominence - a.prominence);
    const finalPeaks = [];
    const used = new Array(values.length).fill(false);

    for (const peak of potentialPeaks) {
      const { index } = peak;
      if (!used[index]) {
        finalPeaks.push(index);
        for (let i = Math.max(0, index - minDistance); i <= Math.min(values.length - 1, index + minDistance); i++) {
          used[i] = true;
        }
      }
    }

    return finalPeaks.sort((a, b) => a - b);
  }, [calculateProminence]); // Only depends on pure function

  // ========================================
  // ERROR HANDLING FUNCTIONS
  // ========================================

  // Helper function to report heart rate errors
  const reportHeartRateError = useCallback((errorType) => {
    setError(errorType);
    
    const errorCodes = {
      "Not enough valid signal data": "ERR_INSUFFICIENT_DATA",
      "Irregular pulse detected": "ERR_IRREGULAR_PULSE",
      "Motion detected": "ERR_MOTION_ARTIFACTS",
      "Poor signal quality": "ERR_POOR_SIGNAL",
      "Measurement outside physiological range": "ERR_INVALID_RANGE",
      "Irregular heart rhythm detected": "ERR_IRREGULAR_RHYTHM",
      "Failed to detect consistent pulse": "ERR_INCONSISTENT_PULSE",
      "Processing error": "ERR_PROCESSING_FAILURE",
      "Insufficient signal quality after maximum capture time": "ERR_TIMEOUT_POOR_SIGNAL",
      "Capture failed": "ERR_CAPTURE_FAILED"
    };
    
    const errorCode = errorCodes[errorType] || "ERR_UNKNOWN";
    
    if (onHeartRateDetected) {
      onHeartRateDetected(null, 0, { 
        error: errorType,
        code: errorCode,
        timestamp: Date.now(),
        details: {
          framesCollected: recentValuesRef.current.length,
          validFrames: 0
        }
      });
    }
  }, [onHeartRateDetected]); // Only depends on prop

  // ========================================
  // MAIN PROCESSING FUNCTIONS (CAREFUL DEPENDENCIES)
  // ========================================

  // Calculate heart rate - BREAK CIRCULAR DEPENDENCY
  const calculateHeartRate = useCallback(() => {
    logEvent(`Calculating heart rate from ${recentValuesRef.current.length} frames`);
    
    if (onProgress) {
      onProgress(100);
    }
    
    const frameDataArray = recentValuesRef.current.map(item => ({
      value: item.value,
      isFingerDetected: true,
      luminance: 150,
      stdDev: 5,
    }));
    
    const validFrameIndices = [];
    
    for (let i = 0; i < frameDataArray.length; i++) {
      const contextValues = recentValuesRef.current.slice(0, i + 1).map(item => item.value);
      const validation = PPGUtils.validateSignal(frameDataArray[i], contextValues);
      
      if (validation.isValid) {
        validFrameIndices.push(i);
      }
    }
    
    if (validFrameIndices.length < 20) {
      logEvent("Not enough valid data for calculation");
      reportHeartRateError("Not enough valid signal data");
      return;
    }
    
    try {
      const values = validFrameIndices.map(i => recentValuesRef.current[i].value);
      const times = validFrameIndices.map(i => recentValuesRef.current[i].timestamp);
      
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i-1]);
      }
      
      logEvent(`Timestamp intervals: min=${Math.min(...intervals)}, max=${Math.max(...intervals)}, count=${intervals.length}`);
      
      const sortedIntervals = [...intervals].sort((a, b) => a - b);
      const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
      const q1 = sortedIntervals[Math.floor(sortedIntervals.length * 0.25)];
      const q3 = sortedIntervals[Math.floor(sortedIntervals.length * 0.75)];
      const iqr = q3 - q1;
      
      const filteredIntervals = intervals.filter(
        interval => (interval >= q1 - 1.5 * iqr) && (interval <= q3 + 1.5 * iqr)
      );
      
      const averageInterval = filteredIntervals.reduce((sum, val) => sum + val, 0) / filteredIntervals.length;
      const samplingRate = 1000 / averageInterval;
      
      logEvent(`Actual sampling rate: ${samplingRate.toFixed(2)} Hz (median interval: ${medianInterval}ms)`);
      
      const smoothedValues = movingAverage(values, 5);
      const detrendedValues = detrendSignal(smoothedValues, 15);
      
      const lowCutoff = 0.5;
      const highCutoff = 3.0;
      const nyquistFreq = samplingRate / 2;
      const adjustedHighCutoff = Math.min(highCutoff, nyquistFreq * 0.8);
      
      logEvent(`Filter parameters: ${lowCutoff.toFixed(2)}-${adjustedHighCutoff.toFixed(2)} Hz (Nyquist: ${nyquistFreq.toFixed(2)} Hz)`);
      
      const filteredValues = bandpassFilter(detrendedValues, lowCutoff, adjustedHighCutoff, samplingRate);
      
      const minPeakDistance = Math.ceil(samplingRate / 4);
      logEvent(`Peak detection parameters: min distance ${minPeakDistance} samples`);
      
      const peaks = findPeaks(filteredValues, minPeakDistance);
      logEvent(`Detected ${peaks.length} peaks`);
      
      if (peaks.length < 4) {
        logEvent("Not enough peaks detected");
        reportHeartRateError("Irregular pulse detected");
        return;
      }
      
      const peakTimes = peaks.map(idx => {
        const safeIdx = Math.min(idx, times.length - 1);
        return times[safeIdx];
      });
      
      const peakIntervals = [];
      for (let i = 1; i < peakTimes.length; i++) {
        peakIntervals.push(peakTimes[i] - peakTimes[i-1]);
      }
      
      const validIntervals = [];
      for (const interval of peakIntervals) {
        const bpm = 60000 / interval;
        if (bpm >= 30 && bpm <= 220) {
          validIntervals.push(interval);
        }
      }
      
      if (validIntervals.length < 3) {
        logEvent("Not enough valid peak intervals");
        reportHeartRateError("Insufficient valid pulse data");
        return;
      }      
      
      const totalIntervalMs = validIntervals.reduce((sum, val) => sum + val, 0);
      const meanInterval = totalIntervalMs / validIntervals.length;
      
      let varianceSum = 0;
      for (const interval of validIntervals) {
        varianceSum += Math.pow(interval - meanInterval, 2);
      }
      
      const intervalStdDev = Math.sqrt(varianceSum / validIntervals.length);
      const variabilityPercent = (intervalStdDev / meanInterval) * 100;
      
      logEvent(`Interval stats: mean=${meanInterval.toFixed(0)}ms, variability=${variabilityPercent.toFixed(1)}%`);
      
      if (variabilityPercent > 25) {
        logEvent("Heart rate too irregular, measurement unreliable");
        reportHeartRateError("Irregular heart rhythm detected");
        return;
      }
      
      const heartRate = Math.round(60000 / meanInterval);
      logEvent(`Calculated heart rate: ${heartRate} BPM`);
      
      if (heartRate < 40 || heartRate > 200) {
        logEvent("Heart rate outside valid range");
        reportHeartRateError("Measurement outside physiological range");
        return;
      }
      
      let confidence = 100;
      confidence -= variabilityPercent;
      confidence -= Math.max(0, 15 - validIntervals.length) * 3;
      confidence = Math.max(0, Math.min(100, confidence));
      
      logEvent(`Final heart rate: ${heartRate} BPM (${confidence.toFixed(0)}% confidence)`);
      
      if (onHeartRateDetected) {
        onHeartRateDetected(heartRate, confidence);
      }
    } catch (error) {
      logEvent(`Error calculating heart rate: ${error.message}`);
      reportHeartRateError("Processing error");
    }
  }, [
    // CAREFUL: Only include truly necessary dependencies
    logEvent, 
    onProgress, 
    onHeartRateDetected, 
    reportHeartRateError,
    movingAverage,
    detrendSignal,
    bandpassFilter,
    findPeaks
  ]);

  // ========================================
  // REMAINING FUNCTIONS WITH MINIMAL DEPENDENCIES
  // ========================================

  // Enhanced frame processor callback for native PPG data
  const onFrameProcessed = useCallback((data) => {
    try {
      // Debug logging for PPG frame data
      console.log('🎯 PPG Frame received:', data);
      
      // Handle native PPG data structure
      if (data.isCalibrating) {
        setSignalQuality(`Calibrating... ${Math.round(data.progress * 100)}%`);
        logEvent(`Calibrating: ${Math.round(data.progress * 100)}%`);
        return;
      }
      
      // Extract values from native PPG processor
      const { 
        bpm, 
        signalValue, 
        signalQuality: quality, 
        waveform,
        heartbeatDetected,
        timestamp,
        signalRange,
        baseline
      } = data;
      
      // Check if we have valid data
      if (typeof signalValue !== 'number' || typeof timestamp !== 'number') {
        console.error('❌ Invalid frame data:', data);
        throw new Error('Invalid frame data structure');
      }
      
      console.log(`✅ Frame processed: BPM=${bpm}, signal=${signalValue.toFixed(2)}, quality=${quality.toFixed(2)}, heartbeat=${heartbeatDetected}`);
      
      if (retryCount > 0) {
        setRetryCount(0);
        logEvent('Frame processing resumed - retry count reset');
      }
      
      if (captureState !== 'active' && isCapturing) {
        setCaptureState('active');
      }
      
      // Check signal quality and provide feedback
      if (quality < 0.3) {
        setSignalQuality("Poor signal - adjust finger position");
      } else if (quality < 0.6) {
        setSignalQuality("Fair signal - hold steady");
      } else {
        setSignalQuality("Good signal - detecting pulse...");
      }
      
      // Store the signal value for processing
      recentValuesRef.current.push({ 
        value: signalValue, 
        timestamp,
        bpm,
        quality
      });
      
      if (recentValuesRef.current.length > 300) {
        recentValuesRef.current.shift();
      }
      
      // If we have a valid BPM from native processor, use it
      if (bpm > 0 && quality > 0.5) {
        const confidence = Math.round(quality * 100);
        logEvent(`Native BPM detected: ${bpm} (${confidence}% confidence)`);
        
        // Wait for stable readings (at least 3 seconds of data)
        if (recentValuesRef.current.length > 90) {
          // Calculate average BPM from recent readings
          const recentBPMs = recentValuesRef.current
            .slice(-30)
            .filter(item => item.bpm > 0)
            .map(item => item.bpm);
          
          if (recentBPMs.length > 10) {
            const avgBPM = Math.round(recentBPMs.reduce((a, b) => a + b, 0) / recentBPMs.length);
            
            if (onHeartRateDetected && avgBPM >= 40 && avgBPM <= 200) {
              onHeartRateDetected(avgBPM, confidence);
              return;
            }
          }
        }
      }
      
      // Log periodic status updates
      if (recentValuesRef.current.length % 30 === 0) {
        logEvent(
          `Frame #${recentValuesRef.current.length}: ` +
          `BPM=${bpm}, ` +
          `Quality=${quality.toFixed(2)}, ` +
          `Range=${signalRange.toFixed(2)}`
        );
      }
      
    } catch (frameError) {
      console.error('Frame processing error:', frameError);
      onError(frameError.message);
    }
  }, [retryCount, captureState, isCapturing, logEvent, onHeartRateDetected, onError]);

  // Rest of the component functions here...
  // (I'll continue with the remaining functions in a way that breaks circular dependencies)

  const onError = useCallback((msg) => {
    console.warn('[PPG Error]', msg);
    logEvent(`PPG Error: ${msg}`);
    setCaptureError(msg);
    setCaptureState('failed');
    
    // Simplified error handling to avoid circular dependencies
    reportHeartRateError(`Capture failed: ${msg}`);
  }, [logEvent, reportHeartRateError]);

  // Simplified frame processor creation
  const frameProcessor = usePPGFrameProcessor(
    onFrameProcessed, 
    onError, 
    isCapturing && captureState === 'active'
  );

  // Enable torch
  const enableTorch = useCallback(() => {
    if (torchTimerRef.current) {
      clearTimeout(torchTimerRef.current);
    }
    
    logEvent("Preparing to turn torch on...");
    torchTimerRef.current = setTimeout(() => {
      if (cameraRef.current && cameraReady) {
        try {
          setIsTorchOn(true);
          logEvent("Torch turned ON");
        } catch (e) {
          logEvent(`Torch error: ${e.message}`);
          setError('Failed to activate flashlight');
        }
      }
    }, 1000);
  }, [cameraReady, logEvent]);

  // Handle camera ready state
  const onCameraReady = useCallback(() => {
    logEvent("Camera is ready!");
    setCameraReady(true);
    if (isCapturing) {
      enableTorch();
    }
  }, [logEvent, isCapturing, enableTorch]);

  // Simplified capture start
  const startCapturing = useCallback(() => {
    recentValuesRef.current = [];
    
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
    }
    
    processingTimerRef.current = setInterval(() => {
      const allFrames = recentValuesRef.current.length;
      const targetFrames = 150;
      
      if (onProgress) {
        const progress = Math.min(Math.floor((allFrames / targetFrames) * 100), 99);
        onProgress(progress);
      }
      
      // Simplified logic to avoid complex dependencies
      if (allFrames >= targetFrames) {
        calculateHeartRate();
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    }, 500);
  }, [onProgress, calculateHeartRate]);
  
  const stopCapturing = useCallback(() => {
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    if (torchTimerRef.current) {
      clearTimeout(torchTimerRef.current);
      torchTimerRef.current = null;
    }
    if (recoveryTimerRef.current) {
      clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
    
    setIsRecovering(false);
    setCaptureError(null);
    setCaptureState('idle');
  }, []);

  // ========================================
  // EFFECTS
  // ========================================
  
  // Request camera permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        logEvent("Requesting camera permission...");
        const granted = await requestPermission();
        logEvent(`Camera permission result: ${granted}`);
        setHasPermission(granted);
        if (!granted) {
          setError('Camera permission not granted');
        }
      } catch (err) {
        logEvent(`Permission error: ${err.message}`);
        setError('Failed to request camera permission');
      }
    };
    
    requestPermissions();

    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
      }
      if (torchTimerRef.current) {
        clearTimeout(torchTimerRef.current);
      }
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current);
      }
    };
  }, [logEvent]);
  
  // Main capture control
  useEffect(() => {
    if (isCapturing) {
      if (hasPermission === 'granted') {
        logEvent("Starting capture process");
        startCapturing();
        if (cameraReady) {
          enableTorch();
        }
      } else {
        logEvent("Can't start capture: no camera permission");
      }
    } else {
      stopCapturing();
      setIsTorchOn(false);
      logEvent("Capture stopped, torch OFF");
    }
  }, [isCapturing, hasPermission, cameraReady, logEvent, startCapturing, stopCapturing, enableTorch]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <View style={styles.container}>
      {(error || captureError) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || captureError}</Text>
        </View>
      )}
      
      {hasPermission === false && (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
        </View>
      )}
      
      {hasPermission === true && device && (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={isCapturing}
            torch={isTorchOn ? 'on' : 'off'}
            frameProcessor={frameProcessor}
            onInitialized={onCameraReady}
          />
          
          <View style={styles.overlay}>
            <Text style={styles.instructionText}>
              Place your finger on the camera and flash
            </Text>
            <Text style={styles.qualityText}>{signalQuality}</Text>

            {isRecovering && (
              <Text style={styles.recoveryText}>
                Recovering... (Attempt {retryCount}/{maxRetries})
              </Text>
            )}
            
            {debugInfo && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>{debugInfo}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  qualityText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    maxWidth: 300,
  },
  debugText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  recoveryText: {
    color: 'orange',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
});