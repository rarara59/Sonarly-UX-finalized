#!/usr/bin/env node

/**
 * Quick Load Test (30 seconds)
 * Shortened version for demonstration
 */

import { ShortLoadTest } from './short-load-test.js';

async function main() {
  const loadTest = new ShortLoadTest();
  
  // Override config for 30-second test
  loadTest.config.testDuration = 30000; // 30 seconds
  loadTest.config.requestInterval = 2000; // Request every 2 seconds (30/min)
  
  console.log('🚀 Running 30-second load test...\n');
  
  await loadTest.runTest();
}

main().catch(console.error);