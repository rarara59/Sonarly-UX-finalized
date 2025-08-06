/**
 * Trading State Manager with GC Integration
 * Manages system state to ensure GC only runs during safe windows
 */

import { gcManager } from '../memory/gcManager.js';

export class TradingStateManager {
  constructor() {
    this.states = {
      SCANNING: 'scanning',
      VALIDATING: 'validating',
      TRADING: 'trading',
      IDLE: 'idle',
      ERROR: 'error',
      INITIALIZING: 'initializing'
    };
    
    this.currentState = this.states.IDLE;
    this.stateHistory = [];
    this.criticalOperations = new Set();
    this.stateMetrics = {
      stateChanges: 0,
      timeInStates: {},
      lastStateChange: Date.now()
    };
    
    // Initialize time tracking for all states
    Object.values(this.states).forEach(state => {
      this.stateMetrics.timeInStates[state] = 0;
    });
    
    this.initialize();
  }
  
  initialize() {
    console.log('✅ Trading State Manager initialized');
    console.log(`📊 Initial state: ${this.currentState}`);
  }
  
  /**
   * Check if current state is safe for GC
   */
  isSafeForGC() {
    const safeStates = [this.states.IDLE, this.states.ERROR, this.states.INITIALIZING];
    const isSafe = safeStates.includes(this.currentState) && this.criticalOperations.size === 0;
    
    return isSafe;
  }
  
  /**
   * Enter a critical section (suspend GC)
   */
  enterCriticalSection(state, operationId = null) {
    const previousState = this.currentState;
    this.currentState = state;
    
    // Track state change
    this.recordStateChange(previousState, state);
    
    // Add to critical operations if ID provided
    if (operationId) {
      this.criticalOperations.add(operationId);
    }
    
    // Suspend GC for critical states
    const criticalStates = [this.states.TRADING, this.states.VALIDATING];
    if (criticalStates.includes(state)) {
      gcManager.suspendAutomaticGC();
      console.log(`🔒 Entered critical state: ${state} (GC suspended)`);
    }
  }
  
  /**
   * Exit critical section (resume GC)
   */
  exitCriticalSection(operationId = null) {
    const previousState = this.currentState;
    this.currentState = this.states.IDLE;
    
    // Track state change
    this.recordStateChange(previousState, this.states.IDLE);
    
    // Remove from critical operations if ID provided
    if (operationId && this.criticalOperations.has(operationId)) {
      this.criticalOperations.delete(operationId);
    }
    
    // Resume GC if no critical operations remain
    if (this.criticalOperations.size === 0) {
      gcManager.resumeAutomaticGC();
      console.log(`🔓 Exited critical state: ${previousState} → IDLE (GC resumed)`);
    }
  }
  
  /**
   * Change state with automatic GC management
   */
  changeState(newState) {
    if (!Object.values(this.states).includes(newState)) {
      console.error(`❌ Invalid state: ${newState}`);
      return;
    }
    
    const previousState = this.currentState;
    this.currentState = newState;
    
    // Track state change
    this.recordStateChange(previousState, newState);
    
    // Manage GC based on new state
    if (this.isSafeForGC()) {
      gcManager.resumeAutomaticGC();
    } else {
      gcManager.suspendAutomaticGC();
    }
    
    console.log(`📊 State changed: ${previousState} → ${newState}`);
  }
  
  /**
   * Record state change for metrics
   */
  recordStateChange(fromState, toState) {
    const now = Date.now();
    const timeInPreviousState = now - this.stateMetrics.lastStateChange;
    
    // Update time spent in previous state
    this.stateMetrics.timeInStates[fromState] += timeInPreviousState;
    
    // Record state change
    this.stateHistory.push({
      from: fromState,
      to: toState,
      timestamp: now,
      duration: timeInPreviousState
    });
    
    // Keep only last 100 state changes
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
    
    this.stateMetrics.stateChanges++;
    this.stateMetrics.lastStateChange = now;
  }
  
  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }
  
  /**
   * Check if system is in a specific state
   */
  isInState(state) {
    return this.currentState === state;
  }
  
  /**
   * Get state metrics for monitoring
   */
  getMetrics() {
    const now = Date.now();
    const currentStateDuration = now - this.stateMetrics.lastStateChange;
    
    // Calculate percentages
    const totalTime = Object.values(this.stateMetrics.timeInStates).reduce((a, b) => a + b, 0) + currentStateDuration;
    const statePercentages = {};
    
    Object.entries(this.stateMetrics.timeInStates).forEach(([state, time]) => {
      const adjustedTime = state === this.currentState ? time + currentStateDuration : time;
      statePercentages[state] = totalTime > 0 ? (adjustedTime / totalTime * 100).toFixed(1) : 0;
    });
    
    return {
      currentState: this.currentState,
      isSafeForGC: this.isSafeForGC(),
      criticalOperations: this.criticalOperations.size,
      stateChanges: this.stateMetrics.stateChanges,
      statePercentages,
      recentHistory: this.stateHistory.slice(-10),
      uptime: totalTime
    };
  }
  
  /**
   * Force state to IDLE (used for emergency situations)
   */
  forceIdle() {
    console.warn('⚠️ Forcing state to IDLE');
    this.currentState = this.states.IDLE;
    this.criticalOperations.clear();
    gcManager.resumeAutomaticGC();
  }
  
  /**
   * Handle system error
   */
  handleError(error) {
    console.error('❌ System error, entering ERROR state:', error.message);
    this.changeState(this.states.ERROR);
    
    // Clear critical operations on error
    this.criticalOperations.clear();
    
    // Allow GC in error state
    gcManager.resumeAutomaticGC();
  }
}

// Export singleton instance
export const tradingStateManager = new TradingStateManager();
export default tradingStateManager;