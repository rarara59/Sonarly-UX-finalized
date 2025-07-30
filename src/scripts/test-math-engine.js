const { ModularEdgeCalculatorJS } = require('./modular-edge-calculator-js.js');

const calc = new ModularEdgeCalculatorJS();

// Test high-volume token (should qualify)
console.log('\n=== Testing High Volume Token ===');
calc.evaluateToken('X69GKB2f', 0.001, 2.0);

// Test low-volume token (should reject)  
console.log('\n=== Testing Low Volume Token ===');
calc.evaluateToken('Fcfw6R48', 0.001, 2.0);

console.log('\n=== Test Complete ===');
