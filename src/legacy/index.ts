// src/config/index.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export const config = {
  // Solana
  solanaRpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://mainnet.helius-rpc.com',
  
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
  
  // Risk management configuration
  riskManagement: {
    configPath: path.join(process.cwd(), 'config', 'risk-config.json'),
    initialCapital: parseInt(process.env.INITIAL_CAPITAL || '100000'), // $100k default
    maxPositionSizePercent: parseInt(process.env.MAX_POSITION_SIZE || '5'),
    stopLossPercent: parseInt(process.env.STOP_LOSS_PERCENT || '15'),
    trailingStopActivation: parseInt(process.env.TRAILING_STOP_ACTIVATION || '20'),
    maxDrawdownPercent: parseInt(process.env.MAX_DRAWDOWN_PERCENT || '25'),
    maxDailyTrades: parseInt(process.env.MAX_DAILY_TRADES || '10'),
    maxExposurePercent: parseInt(process.env.MAX_EXPOSURE_PERCENT || '30'),
    minVolumeDollars: parseInt(process.env.MIN_VOLUME_DOLLARS || '50000'),
    volatilityThreshold: parseInt(process.env.VOLATILITY_THRESHOLD || '200'),
    liquidityThresholdDollars: parseInt(process.env.LIQUIDITY_THRESHOLD || '20000')
  }
};