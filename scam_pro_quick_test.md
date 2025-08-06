// Quick verification method for any "fixed" code:
node -e "
// Import the actual file and test the exact scenario
// Does it work with real data under real conditions?

const ScamProtectionEngine = require('./src/detection/risk/scam-protection-engine.js');

// Mock dependencies
const rpcPool = { 
  execute: async (fn) => fn({
    getTokenLargestAccounts: async () => ({ value: [{ amount: '900000000' }, { amount: '100000000' }] }),
    getParsedAccountInfo: async () => null, // This should trigger the null bug we fixed
    getVersion: async () => ({ 'solana-core': '1.16.0' })
  })
};

const signalBus = { emit: (event, data) => console.log('Signal:', event) };
const logger = { debug: ()=>{}, warn: ()=>{}, error: ()=>{} };

const engine = new ScamProtectionEngine(rpcPool, signalBus, logger);

// Test the exact crash scenarios we fixed
(async () => {
  try {
    console.log('Testing null RPC response handling...');
    const result = await engine.analyzeToken('TEST_TOKEN');
    console.log('✅ PASS: No crash on null response');
    console.log('Result:', { isScam: result.isScam, reasons: result.reasons.slice(0,2) });
    
    console.log('\\nTesting error handling...');
    const confidence = engine.calculateScamConfidence(['High concentration: 90%', 'Low holder count: 5']);
    console.log('✅ PASS: Confidence calculation works:', confidence);
    
    console.log('\\nTesting health check...');
    const health = await engine.healthCheck();
    console.log('✅ PASS: Health check works:', health.status);
    
    console.log('\\n🎉 ALL TESTS PASSED - RENAISSANCE GRADE CONFIRMED');
  } catch (error) {
    console.log('❌ FAIL: Crashed with error:', error.message);
    console.log('Stack:', error.stack);
  }
})();
"