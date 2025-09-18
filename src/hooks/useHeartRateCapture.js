// src/hooks/useHeartRateCapture.js - Mock Version (No Camera Dependencies)
import { useState, useCallback, useEffect } from 'react';
// REMOVED: import { Camera } from 'expo-camera';

export const useHeartRateCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(true); // Mock as granted
  const [progress, setProgress] = useState(0);
  const [heartRate, setHeartRate] = useState(null);
  const [error, setError] = useState(null);

  // Mock camera permissions check
  useEffect(() => {
    const mockPermissionCheck = async () => {
      try {
        console.log("Mock: useHeartRateCapture permission check - simulating granted");
        setHasPermission(true);
        // No error in mock mode
      } catch (err) {
        console.log("Mock: useHeartRateCapture permission error:", err);
        setError('Mock: Camera permission simulation failed');
      }
    };
    
    mockPermissionCheck();
  }, []);

  // Handle progress updates during capture
  useEffect(() => {
    let interval = null;
    if (isCapturing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prevProgress => {
          // Max progress is 95% until we actually get a heart rate
          if (prevProgress >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prevProgress + 1;
        });
      }, 200); // Update every 200ms
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturing]);

  // Start capturing heart rate
  const startCapture = useCallback(() => {
    setError(null);
    setHeartRate(null);
    setIsCapturing(true);
    console.log("Mock: useHeartRateCapture starting capture");
  }, []);

  // Stop capturing heart rate
  const stopCapture = useCallback(() => {
    setIsCapturing(false);
    console.log("Mock: useHeartRateCapture stopping capture");
  }, []);

  // Reset capture state
  const resetCapture = useCallback(() => {
    setHeartRate(null);
    setError(null);
    setProgress(0);
    console.log("Mock: useHeartRateCapture reset");
  }, []);

  // Handle heart rate detection
  const handleHeartRateDetected = useCallback((detectedRate, confidence, errorInfo) => {
    console.log("Mock: useHeartRateCapture heart rate detected:", detectedRate, "confidence:", confidence);
    
    // Handle error case
    if (errorInfo && errorInfo.error) {
      console.log("Mock: useHeartRateCapture detection error:", errorInfo.error);
      setError(`Detection failed: ${errorInfo.error}`);
      setIsCapturing(false);
      return;
    }
    
    setHeartRate(detectedRate);
    setIsCapturing(false);
    setProgress(100);
  }, []);

  return {
    isCapturing,
    hasPermission,
    progress,
    heartRate,
    error,
    startCapture,
    stopCapture,
    resetCapture,
    handleHeartRateDetected
  };
};

export default useHeartRateCapture;