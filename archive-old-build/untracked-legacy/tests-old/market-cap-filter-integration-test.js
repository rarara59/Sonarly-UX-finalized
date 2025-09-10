console.log('✅ Test file found and running!');

import MarketCapRiskFilter from '../src/detection/risk/market-cap-risk-filter.js';
console.log('✅ Market Cap Filter imported successfully!');

// Simple test
const mockRpcPool = { getConnection: () => Promise.resolve({}) };
const mockLogger = { error: console.error, warn: console.warn, info: console.info };

const filter = new MarketCapRiskFilter(mockRpcPool, mockLogger);
console.log('✅ Filter created successfully!');

// Basic functionality test
async function basicTest() {
    console.log('\n🧪 Running basic functionality test...');
    
    const result = await filter.filterByMarketCap({
        marketCapUSD: 500000
    }, 'fresh_gem');
    
    console.log('📊 Test result:', result);
    
    if (result.passed) {
        console.log('🎯 SUCCESS: Basic test passed!');
    } else {
        console.log('❌ FAILED: Basic test failed!');
    }
}

basicTest().catch(console.error);
