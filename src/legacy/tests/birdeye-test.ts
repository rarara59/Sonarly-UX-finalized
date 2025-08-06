// src/tests/birdeye-test.ts
import birdeyeAPI from '../api/birdeye';

describe('BirdeyeAPI', () => {
    const testTokenAddress = 'test_token_address'; // Replace with actual test token

    describe('getTokenPrice', () => {
        it('should fetch current token price', async () => {
            const response = await birdeyeAPI.getTokenPrice(testTokenAddress);
            
            expect(response.success).toBe(true);
            expect(response.data.value).toBeDefined();
            expect(response.data.updateUnixTime).toBeDefined();
        });
    });

    describe('getVolumeHistory', () => {
        it('should fetch 24h volume history', async () => {
            const response = await birdeyeAPI.getVolumeHistory(testTokenAddress);
            
            expect(response.success).toBe(true);
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data[0].value).toBeDefined();
        });

        it('should fetch volume history for different timeframes', async () => {
            const timeframes: ('1H' | '24H' | '7D')[] = ['1H', '24H', '7D'];
            
            for (const timeframe of timeframes) {
                const response = await birdeyeAPI.getVolumeHistory(testTokenAddress, timeframe);
                expect(response.success).toBe(true);
                expect(Array.isArray(response.data)).toBe(true);
            }
        });
    });

    describe('analyzePriceMovement', () => {
        it('should analyze price movements correctly', async () => {
            const analysis = await birdeyeAPI.analyzePriceMovement(testTokenAddress);
            
            expect(analysis.currentPrice).toBeDefined();
            expect(analysis.priceChange24h).toBeDefined();
            expect(analysis.volume24h).toBeDefined();
            expect(analysis.volatility).toBeDefined();
            
            // Validate ranges
            expect(analysis.volatility).toBeGreaterThanOrEqual(0);
            expect(typeof analysis.priceChange24h).toBe('number');
        });
    });

    describe('monitorToken', () => {
        it('should return comprehensive token data', async () => {
            const data = await birdeyeAPI.monitorToken(testTokenAddress);
            
            expect(data.price).toBeDefined();
            expect(Array.isArray(data.volume24h)).toBe(true);
            expect(Array.isArray(data.priceHistory)).toBe(true);
        });
    });
});