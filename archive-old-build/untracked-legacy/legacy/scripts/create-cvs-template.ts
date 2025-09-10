// src/scripts/create-csv-template.ts

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

/**
 * Create a CSV template for wallet data import
 */
function createCsvTemplate() {
  try {
    const headers = [
      'address',
      'network',
      'category',
      'winRate',
      'totalPnL',
      'successfulTrades',
      'totalTrades',
      'avgHoldTime',
      'returns4xRate',
      'avgEntryTiming',
      'avgExitEfficiency',
      'memeTokenWinRate',
      'memeTokenAvgMultiplier',
      'fastTimeframePreference',
      'slowTimeframePreference',
      'tags',
      'primaryStrategies',
      'lastActivity'
    ].join(',');

    // Create 3 sample rows - one for each wallet category
    const sampleRows = [
      // Sniper sample
      [
        'HAN61Gy5RTs1XJKCd3vma86L6MaKvbQnXR2QpzUbFD96q', // address
        'solana', // network
        'Sniper', // category
        '78.5', // winRate
        '230640', // totalPnL
        '100', // successfulTrades
        '349', // totalTrades
        '1h 30m', // avgHoldTime
        '45', // returns4xRate
        '90', // avgEntryTiming (0-100, higher means earlier entry)
        '80', // avgExitEfficiency (0-100, higher means closer to peak)
        '75', // memeTokenWinRate
        '5.2', // memeTokenAvgMultiplier
        '80', // fastTimeframePreference (0-100, preference for 1-4h trades)
        '20', // slowTimeframePreference (0-100, preference for 4-48h trades)
        'fast,profitable,consistent', // tags
        'dip_buying,fomo_detection', // primaryStrategies
        '2025-03-20' // lastActivity
      ].join(','),
      
      // Gem Spotter sample
      [
        'Ehqd8CUhxqkoKAYvKBST3KNRVkbcUpgoKRWQJYNv7QJ4', // address
        'solana', // network
        'Gem Spotter', // category
        '76.2', // winRate
        '185230', // totalPnL
        '112', // successfulTrades
        '147', // totalTrades
        '18h 45m', // avgHoldTime
        '65', // returns4xRate - higher for gem spotters
        '60', // avgEntryTiming
        '85', // avgExitEfficiency - better at selling near peak
        '82', // memeTokenWinRate
        '6.8', // memeTokenAvgMultiplier - higher multipliers
        '30', // fastTimeframePreference - prefers slower trades
        '70', // slowTimeframePreference
        'research,patient,calculated', // tags
        'trend_following,fundamental_analysis', // primaryStrategies
        '2025-03-22' // lastActivity
      ].join(','),
      
      // Early Mover sample
      [
        '33kcDvFUSoDZvsdGjR52L4EDWUMsxf5UVw3CuMbmJJR', // address
        'solana', // network
        'Early Mover', // category
        '74.8', // winRate - right in our target zone
        '162450', // totalPnL
        '92', // successfulTrades
        '123', // totalTrades
        '6h 15m', // avgHoldTime - medium timeframe
        '58', // returns4xRate
        '75', // avgEntryTiming - quite early
        '70', // avgExitEfficiency
        '76', // memeTokenWinRate - specialized in memes
        '4.5', // memeTokenAvgMultiplier
        '60', // fastTimeframePreference
        '40', // slowTimeframePreference - balanced approach
        'momentum,social,sentiment', // tags
        'social_analysis,liquidity_monitoring', // primaryStrategies
        '2025-03-21' // lastActivity
      ].join(',')
    ];

    // Combine headers and sample rows
    const csvContent = [headers, ...sampleRows].join('\n');
    
    // Write to file
    const outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, 'wallet-import-template.csv');
    fs.writeFileSync(filePath, csvContent);
    
    logger.info(`CSV template created at: ${filePath}`);
    
    // Also provide sample output
    console.log('\nCSV Template Preview:');
    console.log(csvContent);
  } catch (error) {
    logger.error('Error creating CSV template:', error instanceof Error ? error.message : String(error));
  }
}

// Run the template creator
createCsvTemplate();