/**
 * Simple Signal Bus Test - Debug hanging issue
 */

console.log('Starting simple signal bus test...');

import { SignalBus } from './src/detection/core/signal-bus.js';

console.log('SignalBus imported successfully');

try {
  const signalBus = new SignalBus();
  console.log('SignalBus instantiated successfully');
  
  // Test basic subscription
  const callback = (event) => console.log('Received event:', event);
  signalBus.on('test-topic', callback);
  console.log('Subscription added successfully');
  
  // Test emit
  signalBus.emit('test-topic', { data: 'test' });
  console.log('Event emitted successfully');
  
  // Clean up
  if (signalBus.cleanupInterval) {
    clearInterval(signalBus.cleanupInterval);
    console.log('Cleanup interval cleared');
  }
  
  console.log('Test completed successfully');
  process.exit(0);
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1);
}