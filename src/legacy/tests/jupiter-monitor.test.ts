// src/tests/jupiter-monitor.test.ts

import { createJupiterMonitor } from '../services/jupiter-monitor';

// Simple test script
async function testJupiterMonitor() {
  console.log('Starting Jupiter Monitor tests...');

  const monitor = createJupiterMonitor({
    rpcEndpoint: 'https://mainnet.helius-rpc.com'  // Will be needed later
  });

  // BONK token address for testing
  const testToken = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

  try {
    // Test market data
    console.log('\nTesting market data fetch...');
    const marketData = await monitor.getMarketData(testToken);
    console.log('Market Data:', {
      price: marketData.price,
      liquidity: marketData.liquidity,
      volume24h: marketData.volume24h
    });

    // Test individual methods
    console.log('\nTesting individual methods...');
    const price = await monitor.getPrice(testToken);
    console.log('Price:', price);

    const liquidity = await monitor.getLiquidity(testToken);
    console.log('Liquidity:', liquidity);

    const volume = await monitor.getVolume24h(testToken);
    console.log('24h Volume:', volume);

    // Test error handling
    console.log('\nTesting error handling...');
    try {
      await monitor.getMarketData('InvalidTokenAddress');
      console.error('❌ Error handling test failed');
      process.exit(1);
    } catch (error) {
      console.log('✓ Error handling working correctly');
    }

    console.log('\n✅ All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testJupiterMonitor();