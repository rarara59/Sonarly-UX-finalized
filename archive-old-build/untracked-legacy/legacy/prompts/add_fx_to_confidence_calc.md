// Add to confidence-calculator.js as utility methods

export class ConfidenceCalculator {
  // ... existing code ...
  
  /**
   * Simple confidence calculation (Renaissance-grade simplicity)
   * Use when you need fast, basic confidence without full scoring
   */
  calculateSimpleConfidence(valid, liquidity) {
    return (valid ? 0.5 : 0) + Math.min(0.5, liquidity / 20);
  }
  
  /**
   * Simple health check
   * Use for basic service health monitoring
   */
  isSystemHealthy(errorRate) {
    return errorRate < 0.1;
  }
  
  // ... rest of existing methods ...
}