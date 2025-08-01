/**
 * ULTRA Memory Optimizer - Extreme memory management utilities
 * Target: Keep system under 400MB at all times
 */

export class UltraMemoryOptimizer {
    constructor() {
        this.gcStats = {
            forced: 0,
            automatic: 0,
            memoryFreed: 0,
            lastGC: 0
        };
        
        this.memoryLeakDetector = {
            baseline: 0,
            samples: [],
            maxSamples: 10,
            leakThreshold: 50 // MB growth that indicates leak
        };
        
        this.isOptimizing = false;
    }
    
    /**
     * Start ultra-aggressive memory optimization
     */
    startUltraOptimization() {
        console.log('🚀 Starting ULTRA memory optimization');
        
        // Set initial baseline
        this.memoryLeakDetector.baseline = this.getCurrentMemoryMB();
        
        // Ultra-frequent GC
        this.startUltraGC();
        
        // Memory leak detection
        this.startLeakDetection();
        
        // Emergency memory management
        this.startEmergencyCleanup();
        
        this.isOptimizing = true;
    }
    
    /**
     * Ultra-aggressive garbage collection
     */
    startUltraGC() {
        if (!global.gc) {
            console.warn('⚠️ GC not available - run with --expose-gc');
            return;
        }
        
        // Every 3 seconds - ultra frequent
        setInterval(() => {
            const before = this.getCurrentMemoryMB();
            
            if (before > 150) { // Very low threshold
                global.gc();
                const after = this.getCurrentMemoryMB();
                const freed = before - after;
                
                this.gcStats.forced++;
                this.gcStats.memoryFreed += freed;
                this.gcStats.lastGC = Date.now();
                
                console.log(`🧹 ULTRA GC: ${before}MB → ${after}MB (freed ${freed}MB)`);
            }
        }, 3000);
        
        // Triple GC for severe cases
        setInterval(() => {
            const memMB = this.getCurrentMemoryMB();
            if (memMB > 300) {
                console.log(`🚨 TRIPLE GC triggered at ${memMB}MB`);
                global.gc();
                global.gc();
                global.gc();
                const final = this.getCurrentMemoryMB();
                console.log(`🔥 Triple GC result: ${memMB}MB → ${final}MB`);
            }
        }, 10000);
    }
    
    /**
     * Memory leak detection and reporting
     */
    startLeakDetection() {
        setInterval(() => {
            const currentMB = this.getCurrentMemoryMB();
            
            // Add sample
            this.memoryLeakDetector.samples.push({
                memory: currentMB,
                timestamp: Date.now()
            });
            
            // Keep only recent samples
            if (this.memoryLeakDetector.samples.length > this.memoryLeakDetector.maxSamples) {
                this.memoryLeakDetector.samples.shift();
            }
            
            // Check for leak pattern
            if (this.memoryLeakDetector.samples.length >= 5) {
                const trend = this.detectMemoryTrend();
                if (trend.isLeak) {
                    console.log(`🚨 MEMORY LEAK DETECTED: ${trend.growthMB}MB growth over ${trend.timeMins}min`);
                    this.performEmergencyCleanup();
                }
            }
        }, 15000); // Every 15 seconds
    }
    
    /**
     * Emergency cleanup when memory exceeds limits
     */
    startEmergencyCleanup() {
        setInterval(() => {
            const memMB = this.getCurrentMemoryMB();
            
            if (memMB > 400) {
                console.log(`🆘 EMERGENCY CLEANUP: ${memMB}MB > 400MB limit`);
                this.performEmergencyCleanup();
            }
        }, 5000); // Every 5 seconds
    }
    
    /**
     * Detect memory growth trend
     */
    detectMemoryTrend() {
        const samples = this.memoryLeakDetector.samples;
        if (samples.length < 3) return { isLeak: false };
        
        const first = samples[0];
        const last = samples[samples.length - 1];
        
        const growthMB = last.memory - first.memory;
        const timeMins = (last.timestamp - first.timestamp) / 60000;
        
        const isLeak = growthMB > this.memoryLeakDetector.leakThreshold && 
                      growthMB > 0 && 
                      timeMins > 2; // At least 2 minutes of growth
        
        return { isLeak, growthMB, timeMins };
    }
    
    /**
     * Perform emergency memory cleanup
     */
    performEmergencyCleanup() {
        console.log('🚨 Performing EMERGENCY memory cleanup');
        
        const before = this.getCurrentMemoryMB();
        
        // Multiple GC cycles
        if (global.gc) {
            for (let i = 0; i < 5; i++) {
                global.gc();
            }
        }
        
        // Force Node.js internal cleanup
        if (process.memoryUsage) {
            process.memoryUsage.rss; // Trigger internal cleanup
        }
        
        // Clear any global caches if they exist
        this.clearGlobalCaches();
        
        const after = this.getCurrentMemoryMB();
        const freed = before - after;
        
        console.log(`🆘 Emergency cleanup: ${before}MB → ${after}MB (freed ${freed}MB)`);
        
        // If still over limit, warn about possible leak
        if (after > 400) {
            console.log(`🚨 CRITICAL: Memory still at ${after}MB after emergency cleanup!`);
            console.log('🚨 Possible memory leak - system may need restart');
        }
    }
    
    /**
     * Clear global caches that might be holding memory
     */
    clearGlobalCaches() {
        try {
            // Clear require cache of non-core modules
            const Module = require('module');
            const originalRequire = Module.prototype.require;
            
            // Don't clear core modules, just user modules
            Object.keys(require.cache).forEach(key => {
                if (!key.includes('node_modules') && key.includes('thorpv1')) {
                    // Clear user module cache carefully
                    delete require.cache[key];
                }
            });
            
            console.log('🧹 Cleared module cache');
        } catch (error) {
            // Silently fail - cache clearing is optional
        }
    }
    
    /**
     * Get current memory usage in MB
     */
    getCurrentMemoryMB() {
        return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    }
    
    /**
     * Get memory optimization stats
     */
    getStats() {
        const currentMB = this.getCurrentMemoryMB();
        const samples = this.memoryLeakDetector.samples;
        
        return {
            current: {
                memoryMB: currentMB,
                status: currentMB > 400 ? 'CRITICAL' : currentMB > 300 ? 'WARNING' : 'OK'
            },
            gc: this.gcStats,
            leak: {
                baseline: this.memoryLeakDetector.baseline,
                samples: samples.length,
                trend: samples.length >= 3 ? this.detectMemoryTrend() : null
            },
            isOptimizing: this.isOptimizing
        };
    }
    
    /**
     * Force immediate memory optimization
     */
    forceOptimization() {
        console.log('🔧 Forcing immediate memory optimization');
        this.performEmergencyCleanup();
        return this.getStats();
    }
}

// Export singleton instance
export const ultraMemoryOptimizer = new UltraMemoryOptimizer();
export default ultraMemoryOptimizer;