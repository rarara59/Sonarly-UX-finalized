// src/scripts/filter-top-wallets.ts
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { logger } from '../utils/logger';

// Read and parse CSV file
function readCSV(filePath: string): any[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    return records;
  } catch (error) {
    console.error('Failed to read CSV file:', error);
    throw error;
  }
}

// Calculate wallet metrics
function calculateWalletMetrics(transactions: any[]) {
  // Basic metrics
  const totalTrades = transactions.length;
  const successfulTrades = transactions.filter(tx => parseFloat(tx.pnl) > 0).length;
  const successRate = (successfulTrades / totalTrades) * 100;
  
  // Calculate 4x returns (ROI >= 4)
  const fourXTrades = transactions.filter(tx => parseFloat(tx.roi) >= 4).length;
  const fourXRate = (fourXTrades / totalTrades) * 100;
  
  // Calculate total PnL and ROI statistics
  const totalPnL = transactions.reduce((sum, tx) => sum + parseFloat(tx.pnl), 0);
  const avgROI = transactions.reduce((sum, tx) => sum + parseFloat(tx.roi), 0) / totalTrades;
  
  // Calculate ROI variance (for consistency)
  const roiValues = transactions.map(tx => parseFloat(tx.roi));
  const roiMean = roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length;
  const roiVariance = roiValues.reduce((sum, roi) => sum + Math.pow(roi - roiMean, 2), 0) / roiValues.length;
  
  // Get unique tokens
  const knownTokens = [...new Set(transactions.map(tx => tx.tokenname))];
  
  // Determine wallet category based on metrics
  let category = 'Unknown';
  if (fourXRate >= 50) {
    category = 'Gem Spotter';
  } else if (successRate >= 80) {
    category = 'Sniper';
  } else {
    category = 'Early Mover';
  }
  
  // Calculate target alignment score (how close to 74-76% success rate)
  const targetAlignmentScore = 100 - Math.min(Math.abs(successRate - 75) * 4, 100);
  
  // Calculate overall score (prioritizing our target criteria)
  const overallScore = 
    (targetAlignmentScore * 0.4) + // 40% weight for being in 74-76% success rate
    (fourXRate * 0.4) +            // 40% weight for 4x achievement rate
    (Math.min(totalTrades / 100, 1) * 100 * 0.2); // 20% weight for having sufficient trade history (max at 100 trades)
  
  return {
    address: transactions[0].wallet,
    walletName: transactions[0].wallet_ens_name || '',
    totalTrades,
    successfulTrades,
    successRate,
    fourXTrades,
    fourXRate,
    totalPnL,
    avgROI,
    roiVariance,
    tokenCount: knownTokens.length,
    category,
    targetAlignmentScore,
    overallScore
  };
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a path to the CSV file: npx ts-node src/scripts/filter-top-wallets.ts data/hello_world.csv');
      process.exit(1);
    }
    
    const filePath = path.resolve(args[0]);
    console.log(`Reading data from CSV file: ${filePath}`);
    
    // Read CSV data
    const records = readCSV(filePath);
    console.log(`Read ${records.length} transactions from CSV file`);
    
    // Group transactions by wallet
    const walletTransactions = new Map();
    
    for (const record of records) {
      const walletAddress = record.wallet;
      
      if (!walletTransactions.has(walletAddress)) {
        walletTransactions.set(walletAddress, []);
      }
      
      walletTransactions.get(walletAddress).push(record);
    }
    
    console.log(`Found ${walletTransactions.size} unique wallets`);
    
    // Calculate metrics for each wallet
    const walletMetrics = [];
    for (const [walletAddress, transactions] of walletTransactions.entries()) {
      // Skip wallets with too few transactions (not statistically significant)
      if (transactions.length < 10) continue;
      
      const metrics = calculateWalletMetrics(transactions);
      walletMetrics.push(metrics);
    }
    
    console.log(`Analyzed ${walletMetrics.length} wallets with sufficient transaction history`);
    
    // Define wallet categories based on our analysis
    const tier1Wallets = walletMetrics.filter(w => 
      w.successRate >= 74 && w.successRate <= 76 && w.fourXRate >= 40);
    
    const tier2Wallets = walletMetrics.filter(w => 
      w.successRate > 80 && w.fourXRate >= 35);
    
    const tier3Wallets = walletMetrics.filter(w => 
      w.successRate >= 65 && w.successRate < 74 && w.fourXRate >= 50);
    
    console.log(`Found ${tier1Wallets.length} Tier 1 wallets (74-76% success rate, 40%+ 4x rate)`);
    console.log(`Found ${tier2Wallets.length} Tier 2 wallets (>80% success rate, 35%+ 4x rate)`);
    console.log(`Found ${tier3Wallets.length} Tier 3 wallets (65-73% success rate, 50%+ 4x rate)`);
    
    // Combine tiers and sort by overall score
    let combinedWallets = [
      ...tier1Wallets.map(w => ({ ...w, tier: 'Tier 1' })),
      ...tier2Wallets.map(w => ({ ...w, tier: 'Tier 2' })),
      ...tier3Wallets.map(w => ({ ...w, tier: 'Tier 3' }))
    ];
    
    // Remove duplicates (wallets could be in multiple tiers)
    combinedWallets = Array.from(new Map(combinedWallets.map(w => [w.address, w])).values());
    
    // Sort by overall score
    combinedWallets.sort((a, b) => b.overallScore - a.overallScore);
    
    // Take top 60 wallets
    const topWallets = combinedWallets.slice(0, 60);
    console.log(`Selected top ${topWallets.length} wallets for tracking`);
    
    // Prepare CSV output
    const csvData = topWallets.map(wallet => ({
      address: wallet.address,
      wallet_name: wallet.walletName,
      category: wallet.category,
      tier: wallet.tier,
      success_rate: wallet.successRate.toFixed(2),
      four_x_rate: wallet.fourXRate.toFixed(2),
      total_trades: wallet.totalTrades,
      successful_trades: wallet.successfulTrades,
      avg_roi: wallet.avgROI.toFixed(2),
      total_pnl: wallet.totalPnL.toFixed(2),
      token_count: wallet.tokenCount,
      overall_score: wallet.overallScore.toFixed(2)
    }));
    
    // Write to CSV file
    const outputPath = path.join(path.dirname(filePath), 'top_wallets.csv');
    fs.writeFileSync(outputPath, stringify(csvData, { header: true }));
    console.log(`Saved top wallets to: ${outputPath}`);
    
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();