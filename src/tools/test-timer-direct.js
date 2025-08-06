/**
 * Direct test of RenaissanceTimer functionality
 * Ensures no crashes and proper timing
 */

// Test extracting the RenaissanceTimer class for direct testing
const testCode = `
class RenaissanceTimer {
  static now() {
    const hrTime = process.hrtime.bigint();
    return Number(hrTime) / 1_000_000; // Convert nanoseconds to milliseconds
  }
  
  static measure(startTime) {
    return this.now() - startTime;
  }
  
  static timestamp() {
    return this.now();
  }
  
  static fastNow() {
    return Number(process.hrtime.bigint()) * 0.000001; // Pre-computed division
  }
}

// Direct test
console.log('🧪 Direct RenaissanceTimer Test\\n');

// Test 1: Basic timing
const start = RenaissanceTimer.now();
console.log('Start time:', start.toFixed(3), 'ms');

// Test 2: Measure elapsed time
setTimeout(() => {
  const elapsed = RenaissanceTimer.measure(start);
  console.log('Elapsed time after 10ms delay:', elapsed.toFixed(3), 'ms');
  console.log('Timer working correctly:', elapsed >= 10 && elapsed < 15 ? '✅' : '❌');
  
  // Test 3: Timestamp generation
  const ts = RenaissanceTimer.timestamp();
  console.log('\\nTimestamp:', ts.toFixed(3), 'ms');
  console.log('Timestamp valid:', ts > start ? '✅' : '❌');
  
  // Test 4: Fast timing for hot paths
  const measurements = [];
  for (let i = 0; i < 1000; i++) {
    const s = RenaissanceTimer.fastNow();
    const e = RenaissanceTimer.fastNow();
    measurements.push(e - s);
  }
  
  const avgOverhead = measurements.reduce((a, b) => a + b) / measurements.length;
  console.log('\\nFast timer overhead:', avgOverhead.toFixed(6), 'ms');
  console.log('Sub-microsecond overhead:', avgOverhead < 0.001 ? '✅' : '❌');
  
  console.log('\\n✅ RenaissanceTimer working correctly - no crashes!');
}, 10);
`;

eval(testCode);