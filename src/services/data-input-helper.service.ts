// src/services/data-input-helper.service.ts

import { BacktestingService, HistoricalTokenData } from './backtesting.service';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

// Simplified trade input structure for easy data entry
interface TradeInput {
  // Required fields
  tokenAddress: string;
  symbol: string;
  entryDate: string; // YYYY-MM-DD format
  entryPrice: number;
  
  // Outcome data
  exitPrice?: number;
  exitDate?: string; // YYYY-MM-DD format
  maxPrice?: number;
  maxPriceDate?: string;
  
  // Performance
  actualReturn: number; // e.g., 4.2 for 4.2x return
  outcome: 'SUCCESS' | 'FAILURE' | 'PENDING';
  
  // Optional context
  name?: string;
  marketCapAtEntry?: number;
  volumeAtEntry?: number;
  liquidityAtEntry?: number;
  
  // Your notes
  notes?: string;
  discoverySource?: string; // "manual_research" | "thorp_signal" | "tip" | etc.
  
  // Original Thorp data (if you have it)
  originalThorgSignals?: any;
}

// CSV format for bulk import
interface TradeCSVRow {
  token_address: string;
  symbol: string;
  entry_date: string;
  entry_price: number;
  exit_price?: number;
  exit_date?: string;
  max_price?: number;
  actual_return: number;
  outcome: string;
  notes?: string;
}

export class DataInputHelper {
  private logger: Logger;
  private backtestingService: BacktestingService;
  private dataDirectory: string;
  
  constructor() {
    this.logger = this.initializeLogger();
    this.backtestingService = new BacktestingService();
    this.dataDirectory = path.join(process.cwd(), 'data', 'trades');
    this.ensureDataDirectory();
  }
  
  private initializeLogger(): Logger {
    return createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/data-input.log' })
      ]
    });
  }
  
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.dataDirectory, { recursive: true });
    } catch (error) {
      this.logger.warn('Could not create data directory:', error);
    }
  }
  
  // 🎯 MAIN METHOD: Add a single trade outcome
  async addTradeOutcome(trade: TradeInput): Promise<void> {
    this.logger.info(`📝 Adding trade outcome: ${trade.symbol} (${trade.outcome})`);
    
    try {
      // Validate input
      this.validateTradeInput(trade);
      
      // Convert to HistoricalTokenData format
      const historicalData = this.convertToHistoricalData(trade);
      
      // Add to backtesting service
      await this.backtestingService.addManualToken(historicalData);
      
      // Save to local file for persistence
      await this.saveTradeToFile(trade);
      
      this.logger.info(`✅ Successfully added ${trade.symbol}: ${trade.actualReturn}x return (${trade.outcome})`);
      
    } catch (error) {
      this.logger.error(`Failed to add trade ${trade.symbol}:`, error);
      throw error;
    }
  }
  
  // 🚀 BULK IMPORT: Add multiple trades from CSV
  async importTradesFromCSV(csvFilePath: string): Promise<void> {
    this.logger.info(`📊 Importing trades from CSV: ${csvFilePath}`);
    
    try {
      const csvContent = await fs.readFile(csvFilePath, 'utf-8');
      const trades = this.parseCSV(csvContent);
      
      this.logger.info(`Found ${trades.length} trades in CSV`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const trade of trades) {
        try {
          await this.addTradeOutcome(trade);
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to import trade ${trade.symbol}:`, error);
          errorCount++;
        }
      }
      
      this.logger.info(`📈 Import complete: ${successCount} successful, ${errorCount} errors`);
      
    } catch (error) {
      this.logger.error('CSV import failed:', error);
      throw error;
    }
  }
  
  // 📋 INTERACTIVE: Guided trade entry
  async interactiveTradeEntry(): Promise<void> {
    this.logger.info('🎯 Starting interactive trade entry...');
    
    // This would typically use a CLI library like inquirer
    // For now, providing the structure for manual implementation
    
    const exampleTrade: TradeInput = {
      tokenAddress: 'EXAMPLE_ADDRESS_HERE',
      symbol: 'EXAMPLE',
      entryDate: '2024-01-15',
      entryPrice: 0.001,
      exitPrice: 0.004,
      exitDate: '2024-01-29',
      maxPrice: 0.0045,
      maxPriceDate: '2024-01-28',
      actualReturn: 4.0,
      outcome: 'SUCCESS',
      name: 'Example Token',
      marketCapAtEntry: 100000,
      notes: 'Found through manual research, strong community',
      discoverySource: 'manual_research'
    };
    
    this.logger.info('📝 Example trade format:', exampleTrade);
    this.logger.info('Use addTradeOutcome() method with this structure');
  }
  
  // 📂 TEMPLATE: Generate CSV template
  async generateCSVTemplate(outputPath?: string): Promise<string> {
    const templatePath = outputPath || path.join(this.dataDirectory, 'trade-template.csv');
    
    const csvHeader = [
      'token_address',
      'symbol', 
      'entry_date',
      'entry_price',
      'exit_price',
      'exit_date',
      'max_price',
      'actual_return',
      'outcome',
      'notes'
    ].join(',');
    
    const exampleRow = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'EXAMPLE',
      '2024-01-15',
      '0.001',
      '0.004',
      '2024-01-29', 
      '0.0045',
      '4.0',
      'SUCCESS',
      'Example successful trade'
    ].join(',');
    
    const csvContent = `${csvHeader}\n${exampleRow}`;
    
    await fs.writeFile(templatePath, csvContent);
    
    this.logger.info(`📋 CSV template generated: ${templatePath}`);
    return templatePath;
  }
  
  // 📊 SUMMARY: Get current trade data summary
  async getTradeDataSummary(): Promise<any> {
    const files = await this.getTradeFiles();
    const allTrades: TradeInput[] = [];
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const trades = JSON.parse(content);
        allTrades.push(...(Array.isArray(trades) ? trades : [trades]));
      } catch (error) {
        this.logger.warn(`Could not read trade file ${file}:`, error);
      }
    }
    
    const summary = {
      totalTrades: allTrades.length,
      successfulTrades: allTrades.filter(t => t.outcome === 'SUCCESS').length,
      failedTrades: allTrades.filter(t => t.outcome === 'FAILURE').length,
      pendingTrades: allTrades.filter(t => t.outcome === 'PENDING').length,
      avgReturn: allTrades.reduce((sum, t) => sum + t.actualReturn, 0) / allTrades.length,
      maxReturn: Math.max(...allTrades.map(t => t.actualReturn)),
      successRate: allTrades.length > 0 ? 
        (allTrades.filter(t => t.outcome === 'SUCCESS').length / allTrades.length) * 100 : 0,
      dateRange: {
        earliest: allTrades.reduce((earliest, t) => 
          t.entryDate < earliest ? t.entryDate : earliest, allTrades[0]?.entryDate || ''),
        latest: allTrades.reduce((latest, t) => 
          t.entryDate > latest ? t.entryDate : latest, allTrades[0]?.entryDate || '')
      }
    };
    
    this.logger.info('📊 TRADE DATA SUMMARY:', summary);
    return summary;
  }
  
  // 🔧 QUICK ADD: Common successful trade patterns
  async addQuickSuccess(tokenAddress: string, symbol: string, returnMultiple: number, daysHeld: number = 14): Promise<void> {
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - daysHeld);
    
    const trade: TradeInput = {
      tokenAddress,
      symbol,
      entryDate: entryDate.toISOString().split('T')[0],
      entryPrice: 1, // Normalized to 1 for percentage calculations
      exitPrice: returnMultiple,
      actualReturn: returnMultiple,
      outcome: returnMultiple >= 4 ? 'SUCCESS' : 'FAILURE',
      discoverySource: 'thorp_signal',
      notes: `Quick add - ${returnMultiple}x return in ${daysHeld} days`
    };
    
    await this.addTradeOutcome(trade);
    this.logger.info(`⚡ Quick success added: ${symbol} - ${returnMultiple}x in ${daysHeld} days`);
  }
  
  // 🔧 QUICK ADD: Common failed trade patterns  
  async addQuickFailure(tokenAddress: string, symbol: string, lossPercentage: number = 50): Promise<void> {
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - 7); // Assume 7 days to failure
    
    const returnMultiple = (100 - lossPercentage) / 100; // e.g., 50% loss = 0.5x
    
    const trade: TradeInput = {
      tokenAddress,
      symbol,
      entryDate: entryDate.toISOString().split('T')[0],
      entryPrice: 1,
      exitPrice: returnMultiple,
      actualReturn: returnMultiple,
      outcome: 'FAILURE',
      discoverySource: 'thorp_signal',
      notes: `Quick add - ${lossPercentage}% loss in 7 days`
    };
    
    await this.addTradeOutcome(trade);
    this.logger.info(`💥 Quick failure added: ${symbol} - ${lossPercentage}% loss`);
  }
  
  // Private helper methods
  
  private validateTradeInput(trade: TradeInput): void {
    if (!trade.tokenAddress) throw new Error('Token address is required');
    if (!trade.symbol) throw new Error('Token symbol is required');
    if (!trade.entryDate) throw new Error('Entry date is required');
    if (!trade.entryPrice || trade.entryPrice <= 0) throw new Error('Valid entry price is required');
    if (!trade.actualReturn || trade.actualReturn <= 0) throw new Error('Valid actual return is required');
    if (!['SUCCESS', 'FAILURE', 'PENDING'].includes(trade.outcome)) {
      throw new Error('Outcome must be SUCCESS, FAILURE, or PENDING');
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trade.entryDate)) {
      throw new Error('Entry date must be in YYYY-MM-DD format');
    }
  }
  
  private convertToHistoricalData(trade: TradeInput): Partial<HistoricalTokenData> {
    const discoveryDate = new Date(trade.entryDate);
    const maxPriceDate = trade.maxPriceDate ? new Date(trade.maxPriceDate) : discoveryDate;
    
    return {
      address: trade.tokenAddress,
      symbol: trade.symbol,
      name: trade.name || trade.symbol,
      discoveryDate,
      discoveryPrice: trade.entryPrice,
      priceAt24h: trade.exitPrice || trade.entryPrice * trade.actualReturn,
      priceAt7d: trade.exitPrice || trade.entryPrice * trade.actualReturn,
      priceAt14d: trade.exitPrice || trade.entryPrice * trade.actualReturn,
      priceAt30d: trade.exitPrice || trade.entryPrice * trade.actualReturn,
      maxPrice: trade.maxPrice || trade.entryPrice * trade.actualReturn,
      maxPriceDate,
      peakReturn: trade.maxPrice ? trade.maxPrice / trade.entryPrice : trade.actualReturn,
      marketCap: trade.marketCapAtEntry || 0,
      volume24h: trade.volumeAtEntry || 0,
      liquidityUSD: trade.liquidityAtEntry || 0,
      holderCount: 0,
      outcome: trade.outcome,
      actualReturn: trade.actualReturn,
      originalThorgSignals: trade.originalThorgSignals,
      dataSource: 'MANUAL'
    };
  }
  
  private async saveTradeToFile(trade: TradeInput): Promise<void> {
    const fileName = `trade-${trade.symbol}-${Date.now()}.json`;
    const filePath = path.join(this.dataDirectory, fileName);
    
    const tradeWithMetadata = {
      ...trade,
      addedAt: new Date().toISOString(),
      source: 'data-input-helper'
    };
    
    await fs.writeFile(filePath, JSON.stringify(tradeWithMetadata, null, 2));
  }
  
  private parseCSV(csvContent: string): TradeInput[] {
    const lines = csvContent.trim().split('\n');
    const header = lines[0].split(',');
    const trades: TradeInput[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row: any = {};
      
      header.forEach((col, index) => {
        row[col.trim()] = values[index]?.trim();
      });
      
      trades.push({
        tokenAddress: row.token_address,
        symbol: row.symbol,
        entryDate: row.entry_date,
        entryPrice: parseFloat(row.entry_price),
        exitPrice: row.exit_price ? parseFloat(row.exit_price) : undefined,
        exitDate: row.exit_date || undefined,
        maxPrice: row.max_price ? parseFloat(row.max_price) : undefined,
        actualReturn: parseFloat(row.actual_return),
        outcome: row.outcome as 'SUCCESS' | 'FAILURE' | 'PENDING',
        notes: row.notes || undefined
      });
    }
    
    return trades;
  }
  
  private async getTradeFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.dataDirectory);
      return files
        .filter(f => f.startsWith('trade-') && f.endsWith('.json'))
        .map(f => path.join(this.dataDirectory, f));
    } catch (error) {
      return [];
    }
  }
}

// 🎯 USAGE EXAMPLES AND DOCUMENTATION

/*
USAGE EXAMPLES:

1. ADD A SINGLE SUCCESSFUL TRADE:
```typescript
const helper = new DataInputHelper();

await helper.addTradeOutcome({
  tokenAddress: 'So11111111111111111111111111111111111111112',
  symbol: 'BONK',
  entryDate: '2024-01-15',
  entryPrice: 0.000012,
  exitPrice: 0.000048,
  actualReturn: 4.0,
  outcome: 'SUCCESS',
  notes: 'Found through Thorp signal, strong community backing'
});
```

2. QUICK ADD SUCCESSFUL TRADES:
```typescript  
await helper.addQuickSuccess('TOKEN_ADDRESS', 'SYMBOL', 5.2, 12); // 5.2x return in 12 days
```

3. BULK IMPORT FROM CSV:
```typescript
await helper.generateCSVTemplate(); // Creates template
// Fill in your trades in the CSV
await helper.importTradesFromCSV('data/trades/my-trades.csv');
```

4. GET SUMMARY:
```typescript
const summary = await helper.getTradeDataSummary();
console.log(`Success rate: ${summary.successRate}%`);
```

CSV FORMAT:
token_address,symbol,entry_date,entry_price,exit_price,exit_date,max_price,actual_return,outcome,notes
So11111111111111111111111111111111111111112,BONK,2024-01-15,0.000012,0.000048,2024-01-29,0.000052,4.0,SUCCESS,Strong community
*/

export { TradeInput, TradeCSVRow };