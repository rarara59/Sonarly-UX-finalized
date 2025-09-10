// HolderVelocitySignalJS - Holder growth analysis
class HolderVelocitySignalJS {
  constructor() {
    this.name = 'HolderVelocitySignalModule';
    this.weight = 0.1;
    this.priority = 80;
  }

  getName() {
    return this.name;
  }

  async execute(context) {
    try {
      const startTime = Date.now();
      
      // Analyze holder growth patterns
      const holderData = await this.analyzeHolderGrowth(context);
      
      // Calculate confidence based on holder velocity
      const confidence = this.calculateHolderConfidence(holderData, context);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`👥 HolderVelocity: ${context.tokenAddress.slice(0,8)} -> ${confidence}% (${holderData.holderCount} holders, ${executionTime}ms)`);
      
      return {
        confidence,
        holderCount: holderData.holderCount,
        holderGrowthRate: holderData.holderGrowthRate,
        avgHolderSize: holderData.avgHolderSize,
        holderConcentration: holderData.holderConcentration,
        executionTime,
        source: 'holder-velocity-js',
        version: '1.0'
      };
      
    } catch (error) {
      console.error(`❌ HolderVelocity error for ${context.tokenAddress.slice(0,8)}:`, error.message);
      return {
        confidence: 10,
        holderCount: 0,
        error: error.message,
        source: 'holder-velocity-js',
        version: '1.0'
      };
    }
  }

  async analyzeHolderGrowth(context) {
    // Mock holder analysis - TODO: Replace with real RPC calls
    const baseHolders = 50 + Math.random() * 200;
    const growthRate = (Math.random() - 0.5) * 0.4; // -20% to +20% growth
    
    return {
      holderCount: Math.floor(baseHolders),
      holderGrowthRate: growthRate,
      avgHolderSize: 1000 + Math.random() * 5000,
      holderConcentration: 0.2 + Math.random() * 0.3 // 20-50% concentration
    };
  }

  calculateHolderConfidence(holderData, context) {
    let confidence = 15; // Base confidence
    
    // Holder count factor
    if (holderData.holderCount > 200) confidence += 25;
    else if (holderData.holderCount > 100) confidence += 20;
    else if (holderData.holderCount > 50) confidence += 15;
    else if (holderData.holderCount > 20) confidence += 10;
    
    // Growth rate factor
    if (holderData.holderGrowthRate > 0.1) confidence += 20; // 10%+ growth
    else if (holderData.holderGrowthRate > 0.05) confidence += 15; // 5%+ growth
    else if (holderData.holderGrowthRate > 0) confidence += 10; // Any growth
    else if (holderData.holderGrowthRate < -0.1) confidence -= 15; // Declining
    
    // Concentration penalty
    if (holderData.holderConcentration > 0.4) confidence -= 10;
    else if (holderData.holderConcentration > 0.3) confidence -= 5;
    
    // Age factor
    if (context.tokenAgeMinutes <= 10) confidence += 10; // Fresh tokens bonus
    
    return Math.max(5, Math.min(70, confidence));
  }
}

export { HolderVelocitySignalJS };

// Individual testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing HolderVelocitySignalJS...');
  
  const signal = new HolderVelocitySignalJS();
  
  const testCases = [
    { tokenAddress: 'X69GKB2f_growing', tokenAgeMinutes: 5, track: 'FAST' },
    { tokenAddress: 'Fcfw6R48_stable', tokenAgeMinutes: 15, track: 'FAST' },
    { tokenAddress: 'test_declining', tokenAgeMinutes: 25, track: 'FAST' }
  ];
  
  for (const testCase of testCases) {
    signal.execute(testCase).then(result => {
      console.log(`✅ Test ${testCase.tokenAddress.slice(0,8)}: ${result.confidence}% confidence`);
      console.log(`   Holders: ${result.holderCount}, Growth: ${(result.holderGrowthRate * 100).toFixed(1)}%`);
    }).catch(err => {
      console.error(`❌ Test ${testCase.tokenAddress.slice(0,8)}: ${err.message}`);
    });
  }
}