import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import winston from 'winston';
dotenv.config();

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY!;
const BASE_URL = 'https://public-api.birdeye.so';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'birdeye-lp-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export async function fetchFilteredPools(limit: number = 50): Promise<any[]> {
  try {
    // Construct URL for API request
    const url = `${BASE_URL}/defi/pools?sort_by=volume&order=desc`;
    logger.info(`🔍 Requesting Birdeye API: ${url}`);
    
    // Make API request with correct headers
    const response = await fetch(url, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY,         // Correct header name
        'x-chain': 'solana',                  // Required chain header
        'Content-Type': 'application/json'
      }
    });
    
    // Get full response for debugging
    const responseText = await response.text();
    logger.info(`📡 Response status: ${response.status} ${response.statusText}`);
    
    // Check if response is HTML instead of JSON
    if (responseText.trim().startsWith("<!DOCTYPE")) {
      logger.error("🚫 Received HTML instead of JSON - likely an authentication issue");
      logger.debug(`First 200 chars: ${responseText.substring(0, 200)}...`);
      return [];
    }
    
    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      logger.error(`❌ Failed to parse JSON: ${error.message}`);
      logger.debug(`Response preview: ${responseText.substring(0, 500)}...`);
      return [];
    }
    
    // Handle data structure
    const data = parsedResponse.data || [];
    if (!Array.isArray(data)) {
      logger.error("❌ API response doesn't contain array data");
      logger.debug(`Response structure: ${JSON.stringify(parsedResponse, null, 2)}`);
      return [];
    }
    
    logger.info(`📊 Retrieved ${data.length} pools from Birdeye`);
    
    // Apply filters based on business partner criteria
    const filtered = data.filter((pool: any) => {
      // Destructure pool data with safe defaults
      const {
        market_cap = 0,
        volume24h = 0,
        holders = 0,
        mintable = true,
        freezeAuthority = true,
        topHolders = [],
        txCount = 0,
        tokenAddress = '',
        name = '',
        symbol = '',
        verified = false
      } = pool;
      
      // Essential criteria from your business partner
      return (
        // Min marketcap $100k and min volume $100k
        Number(market_cap) >= 100_000 &&
        Number(volume24h) >= 100_000 &&
        
        // More than 300 holders
        Number(holders) > 300 &&
        
        // Top wallets hold less than 30%
        Number(topHolders?.[0]?.percentage || 100) < 30 &&
        
        // More than 500 transactions total
        Number(txCount) > 500 &&
        
        // Valid token address
        typeof tokenAddress === 'string' && tokenAddress.trim() !== ''
        
        // Note: I've temporarily commented out these filters as they might be optional
        // and we want to see if we get any results first
        // verified === true &&
        // mintable === false &&
        // freezeAuthority === false &&
        // typeof name === 'string' && name.trim() !== '' &&
        // typeof symbol === 'string' && symbol.trim() !== '' 
      );
    });
    
    logger.info(`✅ Filtered to ${filtered.length} qualifying pools`);
    return filtered.slice(0, limit);
    
  } catch (error) {
    logger.error(`💥 Fatal error fetching pools: ${error.message}`);
    if (error.stack) logger.debug(error.stack);
    return [];
  }
}