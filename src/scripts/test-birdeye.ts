// src/scripts/test-birdeye.ts

import { BirdEyeMonitor } from '../services/apis/birdeye/birdeye-monitor';

async function testBirdEye() {
    console.log('Testing BirdEye API integration...');
    
    // Test token (BONK)
    const testToken = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
    
    try {
        const monitor = new BirdEyeMonitor();
        
        // Test price fetch
        console.log('\nFetching token price...');
        const price = await monitor.getTokenPrice(testToken);
        console.log('Price data:', JSON.stringify(price, null, 2));
        
        // Test volume fetch
        console.log('\nFetching token volume...');
        const volume = await monitor.getTokenVolume(testToken);
        console.log('Volume data:', JSON.stringify(volume, null, 2));
        
        // Test price history
        console.log('\nFetching price history...');
        const history = await monitor.getPriceHistory(testToken, '1H');
        console.log('History data points:', history?.data?.items?.length || 0);
        
        // Test market depth
        console.log('\nFetching market depth...');
        const depth = await monitor.getMarketDepth(testToken);
        console.log('Market depth data:', JSON.stringify(depth, null, 2));
        
        console.log('\nBirdEye API test completed successfully! ✅');
    } catch (error) {
        console.error('Error during BirdEye API test:', error);
    }
}

testBirdEye()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });