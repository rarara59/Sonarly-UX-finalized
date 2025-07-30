import WorkerPoolManager from '../../services/worker-pool-manager.service.js';

// Shared singleton worker pool for all mathematical operations
const sharedWorkerPool = new WorkerPoolManager({
  minWorkers: 2,
  maxWorkers: 16,
  taskTimeout: 30000,
  workerScript: './src/workers/math-worker.js'
});

// Initialize the pool once
let initialized = false;

export async function getSharedWorkerPool() {
  if (!initialized) {
    await sharedWorkerPool.initialize();
    initialized = true;
    console.log('✅ Shared worker pool initialized (2-16 workers)');
  }
  return sharedWorkerPool;
}

export default sharedWorkerPool;