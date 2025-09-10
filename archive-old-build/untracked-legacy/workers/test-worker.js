/**
 * MINIMAL TEST WORKER
 * Simple worker to test basic functionality
 */

import { parentPort, workerData } from 'worker_threads';

const workerId = workerData?.workerId || 'unknown';

console.log(`🔍 Test worker ${workerId} starting...`);

// Test basic message handling
parentPort.on('message', async (message) => {
  console.log('🔍 Test worker received message:', JSON.stringify(message, null, 2));
  
  try {
    const { taskId, type, data } = message;
    
    if (type === 'mathematicalOperations' && data.operation === 'kellyCriterion') {
      const { winRate, avgWin, avgLoss } = data.parameters;
      const kelly = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;
      const result = { kellyFraction: Math.max(0, Math.min(1, kelly)) };
      
      console.log('🔍 Calculated result:', result);
      
      parentPort.postMessage({
        taskId,
        result,
        workerId,
        type,
        success: true
      });
    } else {
      throw new Error(`Unknown task type: ${type}`);
    }
    
  } catch (error) {
    console.log('🔍 Test worker error:', error.message);
    parentPort.postMessage({
      taskId: message.taskId,
      error: error.message,
      workerId,
      type: message.type,
      success: false
    });
  }
});

console.log(`🔍 Test worker ${workerId} ready for messages`);