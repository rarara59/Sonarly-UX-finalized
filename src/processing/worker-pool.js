/**
 * Simple Worker Pool for Pool Data Parsing
 * Target: Parse pool data without blocking main thread
 * 150 lines - Pool parsing only, no academic math
 */

import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkerPool {
  constructor(options = {}) {
    this.config = {
      workerCount: options.workerCount || Math.min(4, os.cpus().length),
      taskTimeout: options.taskTimeout || 5000, // 5s timeout
      workerScript: options.workerScript || join(__dirname, '../workers/pool-parser.js'),
      ...options
    };
    
    // Worker management
    this.workers = [];
    this.currentWorker = 0;
    this.pendingTasks = new Map();
    this.taskCounter = 0;
    
    // Performance tracking
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgParseTime: 0,
      workersActive: 0
    };
    
    this.isShuttingDown = false;
  }
  
  /**
   * Initialize worker pool
   */
  async initialize() {
    console.log(`Starting ${this.config.workerCount} pool parser workers`);
    
    for (let i = 0; i < this.config.workerCount; i++) {
      await this.createWorker(i);
    }
    
    console.log(`Worker pool initialized with ${this.workers.length} workers`);
  }
  
  /**
   * Create single worker
   */
  async createWorker(workerId) {
    try {
      const worker = new Worker(this.config.workerScript, {
        workerData: { workerId }
      });
      
      worker.on('message', (message) => {
        this.handleWorkerMessage(workerId, message);
      });
      
      worker.on('error', (error) => {
        console.error(`Worker ${workerId} error:`, error);
        this.stats.failedTasks++;
      });
      
      worker.on('exit', (code) => {
        if (!this.isShuttingDown && code !== 0) {
          console.warn(`Worker ${workerId} exited with code ${code}, restarting...`);
          setTimeout(() => this.createWorker(workerId), 1000);
        }
      });
      
      this.workers[workerId] = worker;
      
    } catch (error) {
      console.error(`Failed to create worker ${workerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Parse pool data using worker
   */
  async parsePoolData(poolType, accountDataBuffer, layoutConstants) {
    const taskId = ++this.taskCounter;
    const startTime = performance.now();
    
    this.stats.totalTasks++;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingTasks.delete(taskId);
        this.stats.failedTasks++;
        reject(new Error(`Pool parsing timeout for task ${taskId}`));
      }, this.config.taskTimeout);
      
      this.pendingTasks.set(taskId, {
        resolve,
        reject,
        timeout,
        startTime
      });
      
      // Round-robin worker selection
      const worker = this.workers[this.currentWorker];
      this.currentWorker = (this.currentWorker + 1) % this.workers.length;
      
      if (!worker) {
        clearTimeout(timeout);
        this.pendingTasks.delete(taskId);
        reject(new Error('No workers available'));
        return;
      }
      
      try {
        worker.postMessage({
          taskId,
          type: 'parsePool',
          data: {
            poolType,
            accountDataBuffer: Array.from(accountDataBuffer), // Convert Buffer to array
            layoutConstants
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        this.pendingTasks.delete(taskId);
        reject(error);
      }
    });
  }
  
  /**
   * Handle worker response
   */
  handleWorkerMessage(workerId, message) {
    const { taskId, result, error } = message;
    const task = this.pendingTasks.get(taskId);
    
    if (!task) {
      console.warn(`Received response for unknown task ${taskId}`);
      return;
    }
    
    // Clear timeout and remove from pending
    clearTimeout(task.timeout);
    this.pendingTasks.delete(taskId);
    
    // Update metrics
    const parseTime = performance.now() - task.startTime;
    this.updateParseMetrics(parseTime, !error);
    
    if (error) {
      this.stats.failedTasks++;
      task.reject(new Error(error));
    } else {
      this.stats.completedTasks++;
      task.resolve(result);
    }
  }
  
  /**
   * Update parsing performance metrics
   */
  updateParseMetrics(parseTime, success) {
    if (success) {
      if (this.stats.avgParseTime === 0) {
        this.stats.avgParseTime = parseTime;
      } else {
        // Exponential moving average
        this.stats.avgParseTime = 0.1 * parseTime + 0.9 * this.stats.avgParseTime;
      }
    }
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      workersCount: this.workers.length,
      pendingTasks: this.pendingTasks.size,
      successRate: this.stats.totalTasks > 0 ? 
        this.stats.completedTasks / this.stats.totalTasks : 0
    };
  }
  
  /**
   * Health check
   */
  isHealthy() {
    return (
      this.workers.length === this.config.workerCount &&
      this.pendingTasks.size < 100 && // Not overwhelmed
      this.stats.avgParseTime < 10     // Under 10ms average
    );
  }
  
  /**
   * Shutdown worker pool
   */
  async shutdown() {
    console.log('Shutting down worker pool...');
    this.isShuttingDown = true;
    
    // Reject pending tasks
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeout);
      task.reject(new Error('Worker pool shutting down'));
    }
    this.pendingTasks.clear();
    
    // Terminate all workers
    const terminationPromises = this.workers.map(worker => 
      worker ? worker.terminate() : Promise.resolve()
    );
    
    await Promise.allSettled(terminationPromises);
    this.workers = [];
    
    console.log('Worker pool shutdown complete');
  }
}

export default WorkerPool;