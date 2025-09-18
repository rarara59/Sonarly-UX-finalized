Add heart rate detection to the working luma pipeline:

1. In detectPPG.ts, maintain ring buffer of {timestamp, luma} for 8 seconds
2. Implement moving average detrend (subtract 30-sample moving average)
3. Add simple peak detection with 300ms refractory period
4. Calculate BPM from peak intervals: (60000 / average_interval_ms)
5. Display real-time BPM in BiometricCaptureScreen
6. Add quality indicator based on signal variance

Prerequisite: Luma values must already be changing with finger placement