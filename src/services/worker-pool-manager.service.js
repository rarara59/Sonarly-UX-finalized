/**
 * WORKER POOL MANAGER
 * 
 * Renaissance-grade worker thread pool for CPU-intensive parsing operations.
 * Eliminates main thread blocking for LP parsing, price calculations, and mathematical operations.
 * 
 * Key Features:
 * - Dynamic worker scaling based on load
 * - Task queuing with priority levels
 * - Worker health monitoring and replacement
 * - Load balancing across workers
 * - Performance metrics and optimization
 */

import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkerPoolManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      minWorkers: options.minWorkers || 2,
      maxWorkers: options.maxWorkers || Math.max(4, os.cpus().length),
      idleTimeout: options.idleTimeout || 30000, // 30 seconds
      taskTimeout: options.taskTimeout || 10000,  // 10 seconds
      queueMaxSize: options.queueMaxSize || 1000,
      workerScript: options.workerScript || join(__dirname, '../workers/math-worker.js'),
      ...options
    };
    
    // Worker management
    this.workers = new Map(); // worker -> { id, busy, tasks, createdAt, lastUsed }
    this.workerCounter = 0;
    this.taskQueue = [];
    this.pendingTasks = new Map(); // taskId -> { resolve, reject, timeout, priority }
    this.taskCounter = 0;
    
    // Performance metrics
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      avgExecutionTime: 0,
      queueWaitTime: 0,
      workerUtilization: 0,
      peakWorkers: 0,
      tasksPerSecond: 0,
      lastResetTime: Date.now()
    };
    
    // Monitoring
    this.performanceInterval = null;
    this.cleanupInterval = null;
    
    // Shutdown flag
    this.isShuttingDown = false;
  }

  /**
 * Validate worker script exists before starting pool
 */
  async validateWorkerScript() {
    const fs = await import('fs');
    try {
      await fs.promises.access(this.options.workerScript);
      console.log(`Worker script validated: ${this.options.workerScript}`);
    } catch (error) {
      throw new Error(`Worker script not found: ${this.options.workerScript}. Error: ${error.message}`);
    }
  }

  /**
   * Initialize worker pool with minimum workers
   */
  async initialize() {
    console.log(`Initializing worker pool: ${this.options.minWorkers}-${this.options.maxWorkers} workers`);
    
    // Validate worker script exists
    await this.validateWorkerScript();
    
    // Start minimum workers
    for (let i = 0; i < this.options.minWorkers; i++) {
      await this.createWorker();
    }
    
    // Start monitoring
    this.startMonitoring();
    
    this.emit('initialized', {
      minWorkers: this.options.minWorkers,
      maxWorkers: this.options.maxWorkers,
      initialWorkers: this.workers.size
    });
  }

  /**
   * Health check for orchestrator monitoring
   */
  async healthCheck() {
    try {
      // WorkerPool is healthy if:
      // 1. Has active workers
      // 2. No workers are stuck/unhealthy
      // 3. Task queue is not overflowing
      // 4. No memory leaks
      const activeWorkers = Array.from(this.workers.values()).filter(w => w.status === 'idle' || w.status === 'busy').length;
      const hasHealthyWorkers = activeWorkers > 0;
      const queueNotOverflowing = this.taskQueue.length < (this.options.maxWorkers * 10); // Reasonable queue limit
      const noStuckWorkers = Array.from(this.workers.values()).every(w => w.status !== 'error');
      
      const isHealthy = hasHealthyWorkers && queueNotOverflowing && noStuckWorkers;
      
      this.emit('healthCheck', {
        healthy: isHealthy,
        activeWorkers: activeWorkers,
        totalWorkers: this.workers.size,
        queueLength: this.taskQueue.length,
        checks: {
          hasWorkers: hasHealthyWorkers,
          queueSize: queueNotOverflowing,
          noStuckWorkers: noStuckWorkers
        },
        timestamp: Date.now()
      });
      
      return isHealthy;
      
    } catch (error) {
      console.error('WorkerPool health check failed:', error);
      return false;
    }
  }

  /**
   * Create a new worker thread
   */
  async createWorker() {
    const workerId = ++this.workerCounter;
    
    try {
      const worker = new Worker(this.options.workerScript, {
        workerData: { workerId }
      });
      
      const workerInfo = {
        id: workerId,
        busy: false,
        activeTasks: 0,
        totalTasks: 0,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        errors: 0
      };
      
      // Worker event handlers
      worker.on('message', (message) => {
        // Handle worker ready signal
        if (message.type === 'worker_ready') {
          console.log(`Worker ${message.workerId} is ready`);
          this.emit('workerReady', { workerId: message.workerId });
          return;
        }
        this.handleWorkerMessage(worker, message);
      });
      
      worker.on('error', (error) => {
        console.error(`Worker ${workerId} error:`, error);
        workerInfo.errors++;
        this.handleWorkerError(worker, error);
      });
      
      worker.on('exit', (code) => {
        console.log(`Worker ${workerId} exited with code ${code}`);
        this.workers.delete(worker);
        
        // Only replace worker if pool is not shutting down
        if (!this.isShuttingDown && this.workers.size < this.options.minWorkers) {
          this.createWorker().catch(console.error);
        }
      });
      
      this.workers.set(worker, workerInfo);
      this.metrics.peakWorkers = Math.max(this.metrics.peakWorkers, this.workers.size);
      
      console.log(`Worker ${workerId} created. Pool size: ${this.workers.size}`);
      return worker;
      
    } catch (error) {
      console.error(`Failed to create worker ${workerId}:`, error);
      throw error;
    }
  }

  /**
   * Execute task in worker thread with priority and timeout
   */
  async executeTask(taskType, data, options = {}) {
    const taskId = ++this.taskCounter;
    const priority = options.priority || 'normal'; // high, normal, low
    const timeout = options.timeout || this.options.taskTimeout;
    
    this.metrics.totalTasks++;
    
    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        type: taskType,
        data,
        priority,
        createdAt: Date.now(),
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.handleTaskTimeout(taskId);
        }, timeout)
      };
      
      // Add to pending tasks
      this.pendingTasks.set(taskId, task);
      
      // Try to execute immediately or queue
      if (!this.tryExecuteTask(task)) {
        this.queueTask(task);
      }
    });
  }

  /**
   * Try to execute task immediately on available worker
   */
  tryExecuteTask(task) {
    const availableWorker = this.findAvailableWorker();
    
    if (availableWorker) {
      this.assignTaskToWorker(availableWorker, task);
      return true;
    }
    
    // Try to scale up if possible
    if (this.workers.size < this.options.maxWorkers) {
      this.createWorker().then(worker => {
        this.assignTaskToWorker(worker, task);
      }).catch(error => {
        console.error('Failed to create worker for task:', error);
        this.queueTask(task);
      });
      return true;
    }
    
    return false;
  }

  /**
   * Queue task for later execution
   */
  queueTask(task) {
    if (this.taskQueue.length >= this.options.queueMaxSize) {
      clearTimeout(task.timeout);
      task.reject(new Error('Task queue full'));
      this.pendingTasks.delete(task.id);
      return;
    }
    
    // Insert based on priority
    const insertIndex = this.findQueueInsertIndex(task.priority);
    this.taskQueue.splice(insertIndex, 0, task);
    
    this.emit('taskQueued', {
      taskId: task.id,
      queueLength: this.taskQueue.length,
      priority: task.priority
    });
  }

  /**
   * Find available worker (not busy, lowest load)
   */
  findAvailableWorker() {
    let bestWorker = null;
    let lowestLoad = Infinity;
    
    for (const [worker, info] of this.workers) {
      if (!info.busy && info.activeTasks < lowestLoad) {
        bestWorker = worker;
        lowestLoad = info.activeTasks;
      }
    }
    
    return bestWorker;
  }

  /**
   * Assign task to specific worker
   */
  assignTaskToWorker(worker, task) {
    const workerInfo = this.workers.get(worker);
    if (!workerInfo) {
      task.reject(new Error('Worker not found'));
      return;
    }
    
    workerInfo.busy = true;
    workerInfo.activeTasks++;
    workerInfo.totalTasks++;
    workerInfo.lastUsed = Date.now();
    
    const message = {
      taskId: task.id,
      type: task.type,
      data: task.data,
      timestamp: Date.now()
    };
    
    try {
      worker.postMessage(message);
      
      this.emit('taskStarted', {
        taskId: task.id,
        workerId: workerInfo.id,
        type: task.type,
        queueWaitTime: Date.now() - task.createdAt
      });
      
    } catch (error) {
      console.error('Failed to send task to worker:', error);
      this.handleWorkerError(worker, error);
      task.reject(error);
    }
  }

  /**
   * Handle message from worker
   */
  handleWorkerMessage(worker, message) {
    const { taskId, result, error, type } = message;
    const task = this.pendingTasks.get(taskId);
    const workerInfo = this.workers.get(worker);
    
    if (!task || !workerInfo) {
      console.warn(`Received message for unknown task/worker: ${taskId}`);
      return;
    }
    
    // Update worker state
    workerInfo.busy = false;
    workerInfo.activeTasks = Math.max(0, workerInfo.activeTasks - 1);
    
    // Clear timeout
    clearTimeout(task.timeout);
    this.pendingTasks.delete(taskId);
    
    // Update metrics
    const executionTime = Date.now() - (message.startTime || task.createdAt);
    this.updateExecutionMetrics(executionTime, !error);
    
    if (error) {
      this.metrics.failedTasks++;
      task.reject(new Error(error));
      console.error(`Task ${taskId} failed:`, error);
    } else {
      this.metrics.completedTasks++;
      task.resolve(result);
    }
    
    this.emit('taskCompleted', {
      taskId,
      workerId: workerInfo.id,
      success: !error,
      executionTime,
      type
    });
    
    // Process next queued task
    this.processNextQueuedTask();
  }

  /**
   * Process next task from queue
   */
  processNextQueuedTask() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.findAvailableWorker();
    if (availableWorker) {
      const task = this.taskQueue.shift();
      this.assignTaskToWorker(availableWorker, task);
    }
  }

  /**
   * Handle worker error
   */
  handleWorkerError(worker, error) {
    const workerInfo = this.workers.get(worker);
    if (workerInfo) {
      workerInfo.errors++;
      
      // Replace worker if too many errors
      if (workerInfo.errors > 5) {
        console.warn(`Replacing worker ${workerInfo.id} due to excessive errors`);
        this.replaceWorker(worker);
      }
    }
  }

  /**
   * Replace a problematic worker
   */
  async replaceWorker(worker) {
    this.workers.delete(worker);
    
    try {
      await worker.terminate();
    } catch (error) {
      console.warn('Error terminating worker:', error);
    }
    
    // Create replacement
    await this.createWorker();
  }

  /**
   * Handle task timeout
   */
  handleTaskTimeout(taskId) {
    const task = this.pendingTasks.get(taskId);
    if (task) {
      this.pendingTasks.delete(taskId);
      this.metrics.failedTasks++;
      task.reject(new Error(`Task ${taskId} timed out`));
      
      this.emit('taskTimeout', { taskId, type: task.type });
    }
  }

  /**
   * Find queue insert index based on priority
   */
  findQueueInsertIndex(priority) {
    const priorityValues = { high: 3, normal: 2, low: 1 };
    const taskPriority = priorityValues[priority] || 2;
    
    for (let i = 0; i < this.taskQueue.length; i++) {
      const queuedPriority = priorityValues[this.taskQueue[i].priority] || 2;
      if (taskPriority > queuedPriority) {
        return i;
      }
    }
    
    return this.taskQueue.length;
  }

  /**
   * Update execution time metrics
   */
  updateExecutionMetrics(executionTime, success) {
    // Exponential moving average for execution time
    const alpha = 0.1;
    this.metrics.avgExecutionTime = 
      alpha * executionTime + (1 - alpha) * this.metrics.avgExecutionTime;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Performance metrics collection
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 5000); // Every 5 seconds
    
    // Worker cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleWorkers();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const now = Date.now();
    const timeSinceReset = now - this.metrics.lastResetTime;
    
    // Calculate tasks per second
    this.metrics.tasksPerSecond = (this.metrics.completedTasks * 1000) / timeSinceReset;
    
    // Calculate worker utilization
    let busyWorkers = 0;
    for (const [, workerInfo] of this.workers) {
      if (workerInfo.busy || workerInfo.activeTasks > 0) {
        busyWorkers++;
      }
    }
    this.metrics.workerUtilization = this.workers.size > 0 ? busyWorkers / this.workers.size : 0;
    
    this.emit('metricsUpdated', this.getMetrics());
  }

  /**
   * Cleanup idle workers above minimum threshold
   */
  cleanupIdleWorkers() {
    const now = Date.now();
    const workersToRemove = [];
    
    for (const [worker, workerInfo] of this.workers) {
      const idleTime = now - workerInfo.lastUsed;
      
      if (this.workers.size > this.options.minWorkers && 
          !workerInfo.busy && 
          workerInfo.activeTasks === 0 &&
          idleTime > this.options.idleTimeout) {
        
        workersToRemove.push(worker);
      }
    }
    
    // Remove idle workers
    for (const worker of workersToRemove) {
      const workerInfo = this.workers.get(worker);
      console.log(`Removing idle worker ${workerInfo.id}`);
      
      this.workers.delete(worker);
      worker.terminate().catch(console.error);
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeWorkers: this.workers.size,
      busyWorkers: Array.from(this.workers.values()).filter(w => w.busy).length,
      queueLength: this.taskQueue.length,
      pendingTasks: this.pendingTasks.size,
      successRate: this.metrics.totalTasks > 0 ? 
        this.metrics.completedTasks / this.metrics.totalTasks : 0
    };
  }

  /**
   * Health check for THORP system monitoring
   */
  healthCheck() {
    try {
      // Worker pool is healthy if:
      // 1. Has at least minimum workers
      // 2. No workers have excessive errors
      // 3. Task queue is not excessively backed up
      
      const hasMinWorkers = this.workers.size >= this.options.minWorkers;
      const workersHealthy = Array.from(this.workers.values()).every(worker => 
        worker && worker.errors < 10  // Allow some errors but not excessive
      );
      const queueNotOverloaded = this.taskQueue.length < 1000; // Reasonable queue limit
      
      return hasMinWorkers && workersHealthy && queueNotOverloaded;
    } catch (error) {
      console.error('WorkerPoolManager health check error:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('Shutting down worker pool...');
    
    // Set shutdown flag
    this.isShuttingDown = true;
    
    // Clear intervals
    if (this.performanceInterval) clearInterval(this.performanceInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    
    // Reject pending tasks
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeout);
      task.reject(new Error('Worker pool shutting down'));
    }
    this.pendingTasks.clear();
    
    // Clear task queue
    this.taskQueue = [];
    
    // Terminate all workers
    const terminationPromises = [];
    for (const [worker, workerInfo] of this.workers) {
      console.log(`Terminating worker ${workerInfo.id}`);
      terminationPromises.push(worker.terminate());
    }
    
    await Promise.allSettled(terminationPromises);
    this.workers.clear();
    
    console.log('Worker pool shutdown complete');
    this.emit('shutdown');
  }
}

export default WorkerPoolManager;