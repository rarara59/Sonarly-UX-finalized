#!/usr/bin/env node

/**
 * Test script to verify Pump.fun token address extraction fix
 */

import { LiquidityPoolCreationDetectorService } from './src/services/liquidity-pool-creation-detector.service.js';

console.log('🧪 Testing Pump.fun Token Address Extraction Fix\n');

// Create detector instance
const detector = new LiquidityPoolCreationDetectorService({
  rpcManager: { call: () => Promise.resolve({}) },
  solanaPoolParser: {}
});

// Test case 1: Numeric indices (should resolve via accountKeys)
console.log('📋 Test Case 1: Numeric account indices');
const testAccounts1 = [0, 1, 2, 3, 4];
const testAccountKeys1 = [
  'NewTokenMint11111111111111111111111111111111',
  'BondingCurve22222222222222222222222222222222',
  'Creator3333333333333333333333333333333333333',
  'Account4444444444444444444444444444444444444',
  'Account5555555555555555555555555555555555555'
];

const instructionData1 = Buffer.from('e1146fce221eca2e' + '0'.repeat(32), 'hex');

console.log('Calling parsePumpFunInstruction with numeric indices...');
detector.parsePumpFunInstruction(instructionData1, testAccounts1, testAccountKeys1, 'create')
  .then(result => {
    console.log('✅ Result:', {
      tokenMint: result?.tokenA,
      bondingCurve: result?.poolAddress,
      tokenAddress: result?.tokenAddress
    });
    console.log('');
  });

// Test case 2: Direct addresses (legacy format)
console.log('📋 Test Case 2: Direct account addresses');
const testAccounts2 = [
  'DirectTokenMint1111111111111111111111111111',
  'DirectBondingCurve2222222222222222222222222',
  'DirectCreator33333333333333333333333333333'
];
const testAccountKeys2 = []; // Empty for direct addresses

console.log('Calling parsePumpFunInstruction with direct addresses...');
detector.parsePumpFunInstruction(instructionData1, testAccounts2, testAccountKeys2, 'create')
  .then(result => {
    console.log('✅ Result:', {
      tokenMint: result?.tokenA,
      bondingCurve: result?.poolAddress,
      tokenAddress: result?.tokenAddress
    });
    console.log('');
  });

// Test case 3: Mixed format (should handle gracefully)
console.log('📋 Test Case 3: Mixed indices and addresses');
const testAccounts3 = [
  0, // Numeric index
  'DirectBondingCurve2222222222222222222222222', // Direct address
  2  // Numeric index
];
const testAccountKeys3 = [
  'ResolvedTokenMint111111111111111111111111111',
  'ShouldNotBeUsed2222222222222222222222222222',
  'ResolvedCreator3333333333333333333333333333'
];

console.log('Calling parsePumpFunInstruction with mixed format...');
detector.parsePumpFunInstruction(instructionData1, testAccounts3, testAccountKeys3, 'create')
  .then(result => {
    console.log('✅ Result:', {
      tokenMint: result?.tokenA,
      bondingCurve: result?.poolAddress,
      tokenAddress: result?.tokenAddress
    });
    console.log('');
    
    console.log('🎯 Summary:');
    console.log('- Numeric indices should resolve to accountKeys values');
    console.log('- Direct addresses should be used as-is');
    console.log('- No hardcoded 4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf should appear');
  });