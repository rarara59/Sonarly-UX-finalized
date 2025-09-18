// src/utils/FrameProcessor.js
export default class FrameProcessor {
    /**
     * Extract average red intensity from a camera frame
     * @param {Object} frame - The camera frame (with base64 data)
     * @returns {Promise<number>} - Average red value
     */
    static async extractRedChannel(frame) {
      // In a real implementation, we would:
      // 1. Convert the base64 image to an ImageData object
      // 2. Access the pixel data
      // 3. Calculate the average red value
      
      // For this implementation, we'll use a placeholder that could be expanded later
      return new Promise((resolve, reject) => {
        try {
          if (!frame || !frame.base64) {
            throw new Error('Invalid frame data');
          }
          
          // In a complete implementation, you would:
          // - Create an Image object
          // - Load the base64 data
          // - Draw it to a canvas
          // - Get the image data
          // - Calculate average red values
          
          // For now, we'll return a simulated value
          // This simulates what the actual processing would do
          const now = Date.now() / 1000;
          
          // Create a simulated red channel value that varies like a PPG signal
          // We use a combination of a primary heart rate signal, respiratory modulation,
          // and some noise to make it realistic
          const baseValue = 150;
          const heartRateFreq = 1.2; // ~72 BPM
          const respirationFreq = 0.2; // ~12 breaths per minute
          
          const heartPulse = 20 * Math.sin(2 * Math.PI * heartRateFreq * now);
          const respiration = 10 * Math.sin(2 * Math.PI * respirationFreq * now);
          const noise = 5 * (Math.random() - 0.5);
          
          const redValue = baseValue + heartPulse + respiration + noise;
          
          resolve(redValue);
        } catch (error) {
          console.error('Error processing frame:', error);
          reject(error);
        }
      });
    }
    
    /**
     * Implements a sliding window algorithm for real-time heart rate detection
     * @param {Array<number>} values - Array of red intensity values
     * @param {Array<number>} timestamps - Array of corresponding timestamps
     * @param {number} windowSize - Size of the analysis window in seconds
     * @returns {number|null} - Detected heart rate in BPM or null if not enough data
     */
    static analyzeHeartRate(values, timestamps, windowSize = 10) {
      if (!values || !timestamps || values.length < 20 || values.length !== timestamps.length) {
        return null;
      }
      
      try {
        // Get the most recent window of data
        const currentTime = timestamps[timestamps.length - 1];
        const windowStart = currentTime - (windowSize * 1000); // Convert to ms
        
        let windowValues = [];
        let windowTimestamps = [];
        
        // Find data points within our time window
        for (let i = timestamps.length - 1; i >= 0; i--) {
          if (timestamps[i] >= windowStart) {
            windowValues.unshift(values[i]);
            windowTimestamps.unshift(timestamps[i]);
          } else {
            break; // We've gone past our window
          }
        }
        
        // Make sure we have enough data points in our window
        if (windowValues.length < 15) {
          return null;
        }
        
        // Calculate sample rate
        const totalTime = (windowTimestamps[windowTimestamps.length - 1] - windowTimestamps[0]) / 1000;
        const sampleRate = windowValues.length / totalTime;
        
        // Bandpass filter the signal to isolate heart rate frequencies (0.5-4Hz)
        const filteredValues = this.bandpassFilter(
          windowValues,
          0.7, // Low cutoff (Hz)
          3.5, // High cutoff (Hz)
          sampleRate
        );
        
        // Detrend the filtered signal
        const detrendedValues = this.detrend(filteredValues);
        
        // Find peaks in the processed signal
        const peaks = this.findPeaks(detrendedValues, Math.ceil(sampleRate * 0.25));
        
        if (peaks.length < 3) {
          return null; // Not enough peaks for reliable measurement
        }
        
        // Calculate average time between peaks
        let totalInterval = 0;
        for (let i = 1; i < peaks.length; i++) {
          totalInterval += (windowTimestamps[peaks[i]] - windowTimestamps[peaks[i-1]]) / 1000;
        }
        
        const avgInterval = totalInterval / (peaks.length - 1);
        const heartRateInBPM = Math.round(60 / avgInterval);
        
        // Validate the result
        if (heartRateInBPM >= 40 && heartRateInBPM <= 200) {
          return heartRateInBPM;
        } else {
          return null; // Heart rate outside reasonable range
        }
      } catch (error) {
        console.error('Error analyzing heart rate:', error);
        return null;
      }
    }
    
    /**
     * Apply a bandpass filter to isolate heart rate frequencies
     */
    static bandpassFilter(data, lowCutoff, highCutoff, sampleRate) {
      // Implement a simple bandpass filter using moving averages
      // Low pass filter
      const lowPassWindowSize = Math.ceil(sampleRate / lowCutoff);
      const lowPassFiltered = this.movingAverage(data, lowPassWindowSize);
      
      // High pass filter (subtract a more heavily smoothed signal)
      const highPassWindowSize = Math.ceil(sampleRate / highCutoff);
      const verySmoothed = this.movingAverage(data, highPassWindowSize);
      
      // Subtract the very smoothed signal to get the high frequency components
      return lowPassFiltered.map((value, i) => value - verySmoothed[i]);
    }
    
    /**
     * Simple moving average filter
     */
    static movingAverage(data, windowSize) {
      if (!data || data.length < windowSize) {
        return data;
      }
      
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
    
    /**
     * Remove linear trend from data
     */
    static detrend(data) {
      if (!data || data.length < 3) {
        return data;
      }
      
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
    
    /**
     * Find peaks in the signal
     * @param {Array<number>} data - Signal data
     * @param {number} minDistance - Minimum distance between peaks (in samples)
     * @returns {Array<number>} - Array of peak indices
     */
    static findPeaks(data, minDistance = 5) {
      if (!data || data.length < 3) {
        return [];
      }
      
      const peaks = [];
      
      // Normalize data between 0 and 1 for easier threshold determination
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min;
      
      if (range === 0) return []; // Flat signal, no peaks
      
      const normalized = data.map(value => (value - min) / range);
      
      // Adaptive threshold based on signal characteristics
      const meanValue = normalized.reduce((sum, val) => sum + val, 0) / normalized.length;
      const threshold = meanValue + 0.2;
      
      // Find peaks
      for (let i = 1; i < normalized.length - 1; i++) {
        // Local maximum
        if (normalized[i] > normalized[i-1] && normalized[i] > normalized[i+1]) {
          // Check if it's above threshold
          if (normalized[i] > threshold) {
            // Check minimum distance from previous peak
            if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minDistance) {
              peaks.push(i);
            } 
            // If this peak is higher than the previous one and within minimum distance,
            // replace the previous peak with this one
            else if (normalized[i] > normalized[peaks[peaks.length - 1]]) {
              peaks[peaks.length - 1] = i;
            }
          }
        }
      }
      
      return peaks;
    }
  }