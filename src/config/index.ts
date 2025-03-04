// src/config/index.ts

import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Solana
    solanaRpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
    
    // APIs
    birdeyeApiKey: process.env.BIRDEYE_API_KEY,
    dexscreenerApiKey: process.env.DEXSCREENER_API_KEY,
    
    // MongoDB
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/thorpv1',
    
    // System Configuration
    scanLimit: parseInt(process.env.SCAN_LIMIT || '100'),
    minimumLiquidity: parseInt(process.env.MIN_LIQUIDITY || '10000'), // $10k minimum
    
    // Analysis Parameters
    fastPatternWindow: parseInt(process.env.FAST_PATTERN_WINDOW || '4'), // 4 hours
    slowPatternWindow: parseInt(process.env.SLOW_PATTERN_WINDOW || '48'), // 48 hours
    targetSuccessRate: parseFloat(process.env.TARGET_SUCCESS_RATE || '0.75'), // 75%
    minimumEdge: parseFloat(process.env.MINIMUM_EDGE || '0.2'), // 20% minimum edge
};