// src/services/SignalProcessingService.js
export default class SignalProcessingService {
  // Bandpass filter to isolate heart rate frequencies (0.5-4Hz)
  static bandpassFilter(data, lowCutoff, highCutoff, sampleRate) {
    if (!data || data.length < 10) return data;
    
    // Implement a simple low-pass + high-pass filter
    // For a real implementation, a proper FFT-based filter would be better
    
    // First apply a low-pass filter (moving average)
    const lowPassWindow = Math.round(sampleRate / lowCutoff);
    const lowPassFiltered = this.movingAverage(data, lowPassWindow);
    
    // Then apply a high-pass filter (subtract a more heavily smoothed signal)
    const highPassWindow = Math.round(sampleRate / highCutoff);
    const verySmoothed = this.movingAverage(data, highPassWindow);
    
    // Subtract the very smoothed signal to isolate higher frequencies
    const filtered = lowPassFiltered.map((value, i) => {
      return value - (verySmoothed[i] || 0);
    });
    
    return filtered;
  }
  
  // Moving average filter to smooth signal
  static movingAverage(data, windowSize) {
    if (!data || data.length < windowSize) return data;
    
    const result = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += data[j];
        count++;
      }
      
      result.push(sum / count);
    }
    
    return result;
  }
  
  // Find peaks in the signal
  static findPeaks(data, minDistance = 10, threshold = 0.5) {
    if (!data || data.length < minDistance) return [];
    
    const peaks = [];
    
    // Detrend the signal
    const detrended = this.detrend(data);
    
    // Normalize data between 0 and 1
    const max = Math.max(...detrended);
    const min = Math.min(...detrended);
    const range = max - min;
    const normalized = detrended.map(value => (value - min) / range);
    
    // Find peaks (local maxima)
    for (let i = 1; i < normalized.length - 1; i++) {
      if (normalized[i] > normalized[i-1] && normalized[i] > normalized[i+1]) {
        // Check if it's above threshold
        if (normalized[i] > threshold) {
          // Check if it's far enough from the last peak
          if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
            peaks.push(i);
          }
        }
      }
    }
    
    return peaks;
  }
  
  // Remove linear trend from data
  static detrend(data) {
    if (!data || data.length < 2) return data;
    
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += data[i];
      sumXY += i * data[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Subtract the trend line
    return data.map((y, i) => y - (slope * i + intercept));
  }
  
  // Calculate heart rate from peaks
  static calculateHeartRateFromPeaks(peaks, samplePeriodMs) {
    if (!peaks || peaks.length < 2) return 0;
    
    // Calculate average time between peaks in milliseconds
    let totalSamples = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalSamples += peaks[i] - peaks[i-1];
    }
    
    const avgSamplesBetweenPeaks = totalSamples / (peaks.length - 1);
    const periodMs = avgSamplesBetweenPeaks * samplePeriodMs;
    
    // Convert to BPM
    return Math.round(60000 / periodMs);
  }
}