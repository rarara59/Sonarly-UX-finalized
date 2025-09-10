// src/scripts/generate-test-data.ts

import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../utils/database';
import ExternalWallet from '../models/externalWallet';
import { logger } from '../utils/logger';

/**
 * Generate test data for ExternalWallet collection
 */
async function generateTestData() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    logger.info('Connected to MongoDB');

    // Generate sample data for different wallet categories
    const walletCategories = ['Sniper', 'Gem Spotter', 'Early Mover'];
    
    // Create sample wallets for each category
    for (const category of walletCategories) {
      // Generate 5 wallets per category
      for (let i = 0; i < 5; i++) {
        // Generate realistic metrics based on category
        const winRate = category === 'Sniper' 
          ? 65 + Math.random() * 15  // 65-80%
          : category === 'Gem Spotter'
          ? 70 + Math.random() * 10  // 70-80%
          : 60 + Math.random() * 20; // 60-80% for Early Mover
        
        // Create more successful trades for higher win rates
        const totalTrades = 50 + Math.floor(Math.random() * 300);
        const successfulTrades = Math.floor(totalTrades * (winRate / 100));
        
        // Create wallet data
        const wallet = new ExternalWallet({
          address: `${category.replace(' ', '')}${i}${Date.now().toString(36)}`,
          network: 'solana',
          category,
          winRate,
          totalPnL: 50000 + Math.random() * 400000,
          successfulTrades,
          totalTrades,
          avgHoldTime: `${Math.floor(1 + Math.random() * 12)}h ${Math.floor(Math.random() * 60)}m`,
          firstSeen: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
          lastUpdated: new Date(),
          isActive: true,
          reputationScore: 60 + Math.random() * 40,
          
          // Generate sample transactions
          transactions: Array.from({ length: Math.min(10, totalTrades) }, (_, j) => {
            const buyTimestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const holdTimeHours = 1 + Math.random() * (
              category === 'Sniper' ? 6 : // Snipers hold shorter
              category === 'Early Mover' ? 24 : // Early movers mid-term
              48 // Gem spotters hold longer
            );
            const sellTimestamp = new Date(buyTimestamp.getTime() + holdTimeHours * 60 * 60 * 1000);
            
            const buyPrice = 0.01 + Math.random() * 1;
            // 4x returns more common for successful trades
            const multiplier = j < successfulTrades 
              ? (2 + Math.random() * 8) // 2-10x for winners
              : (0.2 + Math.random() * 0.8); // 0.2-1x for losers
            const sellPrice = buyPrice * multiplier;
            
            return {
              tokenSymbol: ['MEME', 'PEPE', 'DOGE', 'CAT', 'SHIB', 'FLOKI'][Math.floor(Math.random() * 6)],
              tokenAddress: `token${j}${Date.now().toString(36)}`,
              buyPrice,
              sellPrice,
              buyAmount: 100 + Math.random() * 900,
              sellAmount: (100 + Math.random() * 900) * multiplier,
              buyTimestamp,
              sellTimestamp,
              pnlValue: (sellPrice - buyPrice) * 1000,
              pnlPercentage: (sellPrice / buyPrice - 1) * 100,
              transactionValue: buyPrice * 1000,
              chain: 'solana',
              isSuccessful: sellPrice > buyPrice
            };
          }),
          
          // Additional metadata
          metadata: {
            preferredTokens: ['MEME', 'DOGE', 'PEPE'],
            tradingFrequency: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            lastActiveTimestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          }
        });
        
        await wallet.save();
        logger.info(`Created ${category} wallet: ${wallet.address}`);
      }
    }

    logger.info('Test data generation completed successfully');
  } catch (error) {
    logger.error('Error generating test data:', error instanceof Error ? error.message : String(error));
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the data generator
generateTestData().catch(console.error);