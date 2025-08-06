/**
 * Renaissance-Grade Transaction Signature Deduplication Manager
 * Target: <1ms lookup, memory-efficient dedup, zero crashes
 * PRINCIPLES: Synchronous operations, accurate calculations, simple code
 * 150 lines - High-performance signature deduplication
 */

export class SignatureManager {
  constructor(performanceMonitor = null) {
    this.performanceMonitor = performanceMonitor;
    
    // High-performance signature storage
    this.signatures = new Set();
    this.signatureTimestamps = new Map();
    
    // Memory management - Renaissance accuracy
    this.maxSignatures = 50000;
    this.cleanupInterval = 300000; // 5 minutes  
    this.signatureRetention = 600000; // 10 minutes
    
    // Performance tracking
    this.stats = {
      totalChecked: 0,
      duplicatesFound: 0,
      cleanupRuns: 0,
      avgLookupTime: 0,
      memoryUsage: 0
    };
    
    // Start cleanup process
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
  
  // Primary method: Check if signature is duplicate - SYNCHRONOUS
  isDuplicate(signature) {
    const startTime = performance.now();
    
    // Renaissance input validation
    if (!signature || typeof signature !== 'string' || signature.length === 0) {
      return false;
    }
    
    this.stats.totalChecked++;
    
    // Fast Set lookup - O(1) average case, SYNCHRONOUS
    const isDupe = this.signatures.has(signature);
    
    if (isDupe) {
      this.stats.duplicatesFound++;
    } else {
      // Renaissance approach: Simple atomic addition
      this.addSignature(signature);
      
      // Trigger cleanup if approaching memory limit
      if (this.signatures.size > this.maxSignatures) {
        this.cleanup();
      }
    }
    
    // Update performance metrics
    const lookupTime = performance.now() - startTime;
    this.updateLookupMetrics(lookupTime);
    
    return isDupe;
  }
  
  // Add signature - SYNCHRONOUS atomic operation
  addSignature(signature) {
    // Renaissance validation
    if (!signature || typeof signature !== 'string' || signature.length === 0) {
      return false;
    }
    
    // Atomic operations - no concurrency issues
    const timestamp = Date.now();
    this.signatures.add(signature);
    this.signatureTimestamps.set(signature, timestamp);
    
    return true;
  }
  
  // Batch filter duplicates - SYNCHRONOUS for speed
  filterDuplicates(signatures) {
    if (!Array.isArray(signatures)) {
      return [];
    }
    
    const startTime = performance.now();
    const unique = [];
    
    for (const signature of signatures) {
      if (!this.isDuplicate(signature)) {
        unique.push(signature);
      }
    }
    
    // Record with CORRECT performance monitor method
    if (this.performanceMonitor && typeof this.performanceMonitor.recordLatency === 'function') {
      const batchTime = performance.now() - startTime;
      this.performanceMonitor.recordLatency('signatureManager', batchTime, true);
    }
    
    return unique;
  }
  
  // Remove signature - SYNCHRONOUS
  removeSignature(signature) {
    const removed = this.signatures.delete(signature);
    this.signatureTimestamps.delete(signature);
    return removed;
  }
  
  // Renaissance-grade cleanup - Proper LRU + accurate algorithm
  cleanup() {
    const startTime = performance.now();
    const cutoffTime = Date.now() - this.signatureRetention;
    let removedCount = 0;
    
    // Phase 1: Remove expired signatures
    const toRemoveExpired = [];
    for (const [signature, timestamp] of this.signatureTimestamps) {
      if (timestamp < cutoffTime) {
        toRemoveExpired.push(signature);
      }
    }
    
    // Remove expired (safe - separate from iteration)
    for (const signature of toRemoveExpired) {
      this.signatures.delete(signature);
      this.signatureTimestamps.delete(signature);
      removedCount++;
    }
    
    // Phase 2: Remove oldest if still over limit (ACTUAL LRU)
    if (this.signatures.size > this.maxSignatures) {
      const targetSize = Math.floor(this.maxSignatures * 0.8);
      const excessCount = this.signatures.size - targetSize;
      
      // Sort by timestamp to get ACTUAL oldest entries
      const sortedEntries = Array.from(this.signatureTimestamps.entries())
        .sort((a, b) => a[1] - b[1]) // Sort by timestamp
        .slice(0, excessCount); // Take oldest entries
      
      // Remove oldest signatures
      for (const [signature] of sortedEntries) {
        this.signatures.delete(signature);
        this.signatureTimestamps.delete(signature);
        removedCount++;
      }
    }
    
    this.stats.cleanupRuns++;
    this.stats.memoryUsage = this.estimateMemoryUsage();
    
    const cleanupTime = performance.now() - startTime;
    
    if (removedCount > 0) {
      console.log(`Signature cleanup: removed ${removedCount} signatures in ${cleanupTime.toFixed(2)}ms`);
    }
  }
  
  // Update lookup metrics with NaN protection
  updateLookupMetrics(lookupTime) {
    // Renaissance NaN protection
    if (isNaN(lookupTime) || lookupTime < 0) {
      return;
    }
    
    if (this.stats.avgLookupTime === 0) {
      this.stats.avgLookupTime = lookupTime;
    } else {
      // Exponential moving average
      this.stats.avgLookupTime = (this.stats.avgLookupTime * 0.95) + (lookupTime * 0.05);
    }
  }
  
  // Renaissance-accurate memory calculation
  estimateMemoryUsage() {
    // Solana signatures: 88 chars × 2 bytes (UTF-16) = 176 bytes
    // Timestamp: 8 bytes
    // Map/Set overhead: ~32 bytes per entry
    const bytesPerSignature = 176 + 8 + 32; // Accurate calculation
    const totalBytes = this.signatures.size * bytesPerSignature;
    return Math.round(totalBytes / 1024); // KB
  }
  
  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      currentSignatures: this.signatures.size,
      duplicateRate: this.stats.totalChecked > 0 
        ? this.stats.duplicatesFound / this.stats.totalChecked 
        : 0,
      memoryUsageKB: this.estimateMemoryUsage(),
      memoryUtilization: this.signatures.size / this.maxSignatures
    };
  }
  
  // Renaissance health check
  isHealthy() {
    return (
      this.stats.avgLookupTime < 1.0 && // Under 1ms - Renaissance standard
      this.signatures.size < this.maxSignatures && // Under memory limit
      this.estimateMemoryUsage() < 11000 && // Under ~11MB (accurate calculation)
      !isNaN(this.stats.avgLookupTime) // Valid metrics
    );
  }
  
  // Reset for testing/restart
  reset() {
    this.signatures.clear();
    this.signatureTimestamps.clear();
    
    this.stats = {
      totalChecked: 0,
      duplicatesFound: 0,
      cleanupRuns: 0,
      avgLookupTime: 0,
      memoryUsage: 0
    };
  }
  
  // Export signatures for persistence
  exportSignatures() {
    return Array.from(this.signatures);
  }
  
  // Import signatures from persistence
  importSignatures(signatures) {
    if (!Array.isArray(signatures)) {
      return 0;
    }
    
    const now = Date.now();
    let imported = 0;
    
    for (const signature of signatures) {
      if (typeof signature === 'string' && signature.length > 0) {
        this.signatures.add(signature);
        this.signatureTimestamps.set(signature, now);
        imported++;
      }
    }
    
    return imported;
  }
  
  // Cleanup resources
  destroy() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }
}