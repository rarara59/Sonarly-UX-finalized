# Create the Smart Wallet Service
cat > src/services/smart-wallet-service.ts << 'EOL'
import { SmartWallet, ISmartWallet, IWalletTransaction } from '../models/smart-wallet';
import { logger } from '../utils/logger';

class SmartWalletService {
  /**
   * Create a new smart wallet
   */
  async createWallet(walletData: Partial<ISmartWallet>): Promise<ISmartWallet> {
    try {
      // Check if wallet already exists
      const existingWallet = await SmartWallet.findOne({ address: walletData.address });
      if (existingWallet) {
        throw new Error(`Wallet with address ${walletData.address} already exists`);
      }
      
      // Create new wallet
      const wallet = new SmartWallet({
        ...walletData,
        firstSeen: new Date(),
        lastUpdated: new Date()
      });
      
      await wallet.save();
      logger.info(`Created new wallet ${wallet.address}`);
      return wallet;
    } catch (error) {
      logger.error(`Error creating wallet: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get a wallet by address
   */
  async getWalletByAddress(address: string): Promise<ISmartWallet | null> {
    try {
      return await SmartWallet.findOne({ address });
    } catch (error) {
      logger.error(`Error getting wallet ${address}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update a wallet
   */
  async updateWallet(address: string, updateData: Partial<ISmartWallet>): Promise<ISmartWallet | null> {
    try {
      // Find and update the wallet
      const updatedWallet = await SmartWallet.findOneAndUpdate(
        { address },
        { 
          ...updateData,
          lastUpdated: new Date()
        },
        { new: true } // Return the updated document
      );
      
      if (!updatedWallet) {
        logger.warn(`Wallet ${address} not found for update`);
        return null;
      }
      
      logger.info(`Updated wallet ${address}`);
      return updatedWallet;
    } catch (error) {
      logger.error(`Error updating wallet ${address}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Add transaction to wallet
   */
  async addTransaction(address: string, transaction: IWalletTransaction): Promise<ISmartWallet | null> {
    try {
      // Check if transaction already exists
      const wallet = await SmartWallet.findOne({ 
        address, 
        'transactions.transactionHash': transaction.transactionHash 
      });
      
      if (wallet) {
        logger.info(`Transaction ${transaction.transactionHash} already exists for wallet ${address}`);
        return wallet;
      }
      
      // Add transaction and update stats
      const updatedWallet = await SmartWallet.findOneAndUpdate(
        { address },
        { 
          $push: { transactions: transaction },
          $set: { lastTradeAt: new Date(), lastUpdated: new Date() },
          $inc: { 
            totalTrades: 1,
            ...(transaction.isSuccessful ? { successfulTrades: 1 } : {})
          }
        },
        { new: true }
      );
      
      if (!updatedWallet) {
        logger.warn(`Wallet ${address} not found for transaction add`);
        return null;
      }
      
      // Update win rate
      if (updatedWallet.totalTrades > 0) {
        updatedWallet.winRate = (updatedWallet.successfulTrades / updatedWallet.totalTrades) * 100;
        await updatedWallet.save();
      }
      
      logger.info(`Added transaction ${transaction.transactionHash} to wallet ${address}`);
      return updatedWallet;
    } catch (error) {
      logger.error(`Error adding transaction to wallet ${address}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find high-performing wallets
   */
  async findHighPerformingWallets(options: {
    minWinRate?: number;
    minSuccessfulTrades?: number;
    category?: string;
    limit?: number;
  } = {}): Promise<ISmartWallet[]> {
    try {
      const { 
        minWinRate = 74, // Targeting 74-76% success rate
        minSuccessfulTrades = 30,
        category,
        limit = 20
      } = options;
      
      // Build query
      const query: any = {
        winRate: { $gte: minWinRate },
        successfulTrades: { $gte: minSuccessfulTrades },
        isActive: true
      };
      
      // Add category filter if provided
      if (category) {
        query.category = category;
      }
      
      // Find wallets matching criteria, sorted by win rate and confidence score
      const wallets = await SmartWallet.find(query)
        .sort({ winRate: -1, confidenceScore: -1 })
        .limit(limit);
      
      logger.info(`Found ${wallets.length} high-performing wallets`);
      return wallets;
    } catch (error) {
      logger.error(`Error finding high-performing wallets: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Find wallets with high 4x achievement rate
   */
  async findWalletsWith4xPotential(options: {
    minAchieves4xScore?: number;
    limit?: number;
  } = {}): Promise<ISmartWallet[]> {
    try {
      const { 
        minAchieves4xScore = 30, // At least 30% of trades achieve 4x
        limit = 20
      } = options;
      
      // Find wallets with high 4x achievement rate
      const wallets = await SmartWallet.find({
        'metadata.achieves4xScore': { $gte: minAchieves4xScore },
        isActive: true
      })
        .sort({ 'metadata.achieves4xScore': -1 })
        .limit(limit);
      
      logger.info(`Found ${wallets.length} wallets with high 4x potential`);
      return wallets;
    } catch (error) {
      logger.error(`Error finding wallets with 4x potential: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Deactivate a wallet
   */
  async deactivateWallet(address: string): Promise<ISmartWallet | null> {
    try {
      const wallet = await SmartWallet.findOneAndUpdate(
        { address },
        { isActive: false, lastUpdated: new Date() },
        { new: true }
      );
      
      if (!wallet) {
        logger.warn(`Wallet ${address} not found for deactivation`);
        return null;
      }
      
      logger.info(`Deactivated wallet ${address}`);
      return wallet;
    } catch (error) {
      logger.error(`Error deactivating wallet ${address}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get wallet stats
   */
  async getWalletStats(): Promise<any> {
    try {
      const totalWallets = await SmartWallet.countDocuments();
      const activeWallets = await SmartWallet.countDocuments({ isActive: true });
      
      const categories = await SmartWallet.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]);
      
      const avgWinRate = await SmartWallet.aggregate([
        { $group: { _id: null, avgWinRate: { $avg: '$winRate' } } }
      ]);
      
      return {
        totalWallets,
        activeWallets,
        categories: categories.map(c => ({ category: c._id, count: c.count })),
        avgWinRate: avgWinRate[0]?.avgWinRate || 0
      };
    } catch (error) {
      logger.error(`Error getting wallet stats: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export default new SmartWalletService();
EOL