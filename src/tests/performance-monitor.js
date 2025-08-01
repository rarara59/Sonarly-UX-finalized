// src/tests/performance-monitor.js
const DataPipeline = require('../scripts-js/data-pipeline');

async function monitorPerformance() {
  const pipeline = new DataPipeline();
  await pipeline.initialize();
  
  setInterval(async () => {
    const metrics = pipeline.getMetrics();
    console.log(`
📊 Pipeline Performance:
   Tokens Processed: ${metrics.tokensProcessed}
   Average Time: ${metrics.averageProcessingTime}ms
   Success Rate: ${metrics.successRate.toFixed(1)}%
   Queue Size: ${metrics.queueSize}
   Throughput: ${metrics.throughput.toFixed(1)} tokens/sec
    `);
  }, 10000); // Every 10 seconds
}

monitorPerformance();