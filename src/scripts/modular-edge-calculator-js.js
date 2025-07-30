// Renaissance-style Mathematical Engine - JavaScript Version
// Preserves exact volume multipliers and age bonuses

class ModularEdgeCalculatorJS {
  constructor(logger) {
    this.logger = logger || console;
    console.log("🔧 ModularEdgeCalculator-JS constructed");
  }

  // Core Mathematical Engine - EXACT copy of your formulas
  calculateVolumeMultiplier(volume, age) {
    const ageAdj = Math.max(0.5, Math.min(1, age / 15));
    const v = volume / ageAdj;
    
    console.log(`📊 VOLUME_DEBUG: Raw=${volume}, Age=${age}, AgeAdj=${ageAdj.toFixed(2)}, Adjusted=${v.toFixed(0)}`);
    
    if (v >= 100_000) return 3;
    if (v >= 50_000) return 2.5;
    if (v >= 20_000) return 2;
    if (v >= 10_000) return 1.5;
    if (v >= 5_000) return 1.2;
    if (v >= 2_000) return 1;
    if (v >= 1_000) return 0.8;
    if (v >= 500) return 0.6;
    return 0.3;
  }

  calculateAgeBonus(age) {
    if (age <= 2) return 1.3;
    if (age <= 5) return 1.2;
    if (age <= 10) return 1.1;
    if (age <= 30) return 1.0;
    if (age <= 60) return 0.95;
    return 0.9;
  }

  // Simplified evaluation for testing
  async evaluateToken(tokenAddress, currentPrice, ageMin) {
    // Mock base signals (we'll add real ones later)
    const baseSignalScore = 0.1675; // 16.75% base (matches your original)
    
    // Mock volume (we'll integrate real volume later)
    const mockVolume = tokenAddress.includes('X69GKB2f') ? 100000 : 
                      tokenAddress.includes('Fcfw6R48') ? 378 : 
                      Math.random() * 50000;
    
    const volumeMultiplier = this.calculateVolumeMultiplier(mockVolume, ageMin);
    const ageBonus = this.calculateAgeBonus(ageMin);
    
    const finalScore = baseSignalScore * volumeMultiplier * ageBonus;
    const confidence = Math.min(finalScore * 100, 95);
    const isQualified = finalScore >= 0.65;
    
    console.log(`🧮 FINAL_DEBUG: ${tokenAddress.slice(0,8)} - Base=${baseSignalScore} × Volume=${volumeMultiplier} × Age=${ageBonus} = ${finalScore.toFixed(3)} (${confidence.toFixed(1)}%)`);
    
    return {
      tokenAddress,
      finalScore,
      confidence,
      isQualified,
      track: ageMin <= 30 ? "FAST" : "SLOW",
      volume: mockVolume,
      volumeMultiplier,
      ageBonus,
      processingMethod: "javascript-math-engine",
      timestamp: new Date()
    };
  }
}

module.exports = { ModularEdgeCalculatorJS };

// Test execution - validate mathematical engine
if (require.main === module) {
  console.log("🚀 Testing Mathematical Engine...");
  
  const calc = new ModularEdgeCalculatorJS(console);
  
  // Test with known token examples
  const testTokens = [
    { addr: "X69GKB2f_high_volume", price: 0.001, age: 5 },
    { addr: "Fcfw6R48_low_volume", price: 0.0005, age: 10 },
    { addr: "test_fresh_token", price: 0.002, age: 1 }
  ];
  
  for (const token of testTokens) {
    calc.evaluateToken(token.addr, token.price, token.age)
      .then(result => {
        console.log(`✅ ${token.addr}: ${result.confidence.toFixed(1)}% (${result.isQualified ? 'QUALIFIED' : 'not qualified'})`);
      });
  }
}