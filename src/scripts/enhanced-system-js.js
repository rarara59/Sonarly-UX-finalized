console.log(`🚀 PROCESS_START: ${new Date().toISOString()} - Node process began`);

require('dotenv').config();
const { ModularEdgeCalculatorJS } = require('./modular-edge-calculator-js.js');

console.log(`🕐 ${new Date().toISOString()} - Script start with math engine`);

// Initialize mathematical engine
const mathEngine = new ModularEdgeCalculatorJS();

// Mock some test tokens for validation
const testTokens = [
  { address: 'X69GKB2fLN8tSUxNTMneGAQw79qDw9KcPQp3RoAk9cf', price: 0.001, age: 2.0 },
  { address: 'Fcfw6R48AJf42HRy1sW8KfUmYjdE5FTYmUgkz4Lpump', price: 0.001, age: 0.4 },
  { address: 'TestToken1234567890abcdef', price: 0.002, age: 5.0 }
];

(async () => {
  console.log('🧮 Testing integrated mathematical system...');
  
  for (const token of testTokens) {
    const result = await mathEngine.evaluateToken(token.address, token.price, token.age);
    
    if (result.isQualified) {
      console.log(`✅ QUALIFIED: ${token.address.slice(0,8)} - ${result.confidence.toFixed(1)}% confidence`);
    } else {
      console.log(`❌ REJECTED: ${token.address.slice(0,8)} - ${result.confidence.toFixed(1)}% confidence`);
    }
  }
  
  console.log('🎯 MATHEMATICAL SYSTEM READY - Fast startup + Renaissance math');
})();