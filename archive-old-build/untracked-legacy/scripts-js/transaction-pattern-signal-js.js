// TransactionPatternSignalJS - Transaction pattern detection
class TransactionPatternSignalJS {
  constructor() {
    this.name = 'TransactionPatternSignalModule';
    this.weight = 0.05;
    this.priority = 70;
  }

  getName() {
    return this.name;
  }

  async execute(context) {
    try {
      const startTime = Date.now();
      
      // Analyze transaction patterns
      const patternData = await this.analyzeTransactionPatterns(context);
      
      // Calculate confidence based on transaction health
      const confidence = this.calculatePatternConfidence(patternData, context);
      
      const executionTime = Date.now() - startTime;
      
      console.log(`📊 TxPattern: ${context.tokenAddress.slice(0,8)} -> ${confidence}% (${patternData.txCount} txns, ${executionTime}ms)`);
      
      return {
        confidence,
        txCount: patternData.txCount,
        buyPressure: patternData.buyPressure,
        avgTxSize: patternData.avgTxSize,
        uniqueTraders: patternData.uniqueTraders,
        executionTime,
        source: 'transaction-pattern-js',
        version: '1.0'
      };
      
    } catch (error) {
      console.error(`❌ TxPattern error for ${context.tokenAddress.slice(0,8)}:`, error.message);
      return {
        confidence: 15,
        txCount: 0,
        error: error.message,
        source: 'transaction-pattern-js',
        version: '1.0'
      };
    }
  }

  async analyzeTransactionPatterns(context) {
    // Mock transaction analysis - TODO: Replace with real RPC calls
    const baseTxCount = 20 + Math.random() * 80;
    const buyPressure = 0.3 + Math.random() * 0.4; // 30-70% buy pressure
    
    return {
      txCount: Math.floor(baseTxCount),
      buyPressure,
      avgTxSize: 500 + Math.random() * 2000,
      uniqueTraders: Math.floor(baseTxCount * 0.7) // 70% unique traders
    };
  }

  calculatePatternConfidence(patternData, context) {
    let confidence = 20; // Base confidence
    
    // Transaction count factor
    if (patternData.txCount > 80) confidence += 20;
    else if (patternData.txCount > 50) confidence += 15;
    else if (patternData.txCount > 30) confidence += 10;
    else if (patternData.txCount > 15) confidence += 5;
    
    // Buy pressure factor
    if (patternData.buyPressure > 0.6) confidence += 15; // Strong buying
    else if (patternData.buyPressure > 0.5) confidence += 10; // Moderate buying
    else if (patternData.buyPressure < 0.4) confidence -= 10; // Weak buying
    
    // Average transaction size factor
    if (patternData.avgTxSize > 2000) confidence += 10; // Large transactions
    else if (patternData.avgTxSize > 1000) confidence += 5; // Medium transactions
    
    // Unique trader factor
    if (patternData.uniqueTraders > 50) confidence += 10;
    else if (patternData.uniqueTraders > 30) confidence += 5;
    
    // Age factor
    if (context.tokenAgeMinutes <= 15) confidence += 5; // Fresh activity bonus
    
    return Math.max(10, Math.min(65, confidence));
  }
}

export { TransactionPatternSignalJS };

// Individual testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 Testing TransactionPatternSignalJS...');
  
  const signal = new TransactionPatternSignalJS();
  
  const testCases = [
    { tokenAddress: 'X69GKB2f_active', tokenAgeMinutes: 3, track: 'FAST' },
    { tokenAddress: 'Fcfw6R48_moderate', tokenAgeMinutes: 12, track: 'FAST' },
    { tokenAddress: 'test_low_activity', tokenAgeMinutes: 20, track: 'FAST' }
  ];
  
  for (const testCase of testCases) {
    signal.execute(testCase).then(result => {
      console.log(`✅ Test ${testCase.tokenAddress.slice(0,8)}: ${result.confidence}% confidence`);
      console.log(`   Txns: ${result.txCount}, Buy Pressure: ${(result.buyPressure * 100).toFixed(1)}%`);
    }).catch(err => {
      console.error(`❌ Test ${testCase.tokenAddress.slice(0,8)}: ${err.message}`);
    });
  }
}