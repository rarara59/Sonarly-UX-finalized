// src/signal-modules/smart-wallet-signal.module.ts
// EXACT FIX: Replace await connectToDatabase() with mongoose connection check

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from './signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';
import SmartWallet from '../legacy/smartWallet';
import mongoose from 'mongoose'; // ← ADD: Import mongoose for connection check
// REMOVE: import { connectToDatabase } from '../config/database'; 
import { PublicKey } from '@solana/web3.js';

export class SmartWalletSignalModule extends SignalModule {
  constructor(config: SignalModuleConfig) {
    super('smart-wallet', config);
  }

  getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
    return 'BOTH';
  }

  getSignalType(): keyof DetectionSignals {
    return 'smartWallet';
  }

  async execute(context: SignalContext): Promise<SignalResult> {
    const startTime = performance.now();
    
    try {
      // ✅ REPLACE: await connectToDatabase(); 
      // ✅ WITH: Connection state check
      if (mongoose.connection.readyState !== 1) {
        context.logger.warn('[SmartWallet] MongoDB not connected, skipping analysis');
        return {
          confidence: 0,
          data: {
            detected: false,
            confidence: 0,
            tier1Count: 0,
            tier2Count: 0,
            tier3Count: 0,
            overlapCount: 0,
            totalWeight: 0,
            walletAddresses: []
          },
          processingTime: performance.now() - startTime,
          source: 'smart-wallet-module',
          version: this.config.version
        };
      }

      const smartWallets = await SmartWallet.find({ isActive: true });
      const detectedWallets = [];
      let tier1Count = 0, tier2Count = 0, tier3Count = 0;
      
      for (const wallet of smartWallets) {
        const hasActivity = await this.checkWalletTokenActivity(
          wallet.address, 
          context.tokenAddress, 
          context.rpcManager
        );
        
        if (hasActivity) {
          detectedWallets.push(wallet.address);
          
          if (wallet.tierMetrics?.tier === 1) tier1Count++;
          else if (wallet.tierMetrics?.tier === 2) tier2Count++;
          else tier3Count++;
        }
      }
      
      const totalWeight = tier1Count * 5.0 + tier2Count * 3.0 + tier3Count * 1.0;
      const maxPossibleWeight = smartWallets.length * 5.0;
      const confidence = maxPossibleWeight > 0 ? (totalWeight / maxPossibleWeight) * 100 : 0;
      
      const data = {
        detected: detectedWallets.length >= 2,
        confidence,
        tier1Count,
        tier2Count,
        tier3Count,
        overlapCount: detectedWallets.length,
        totalWeight,
        walletAddresses: detectedWallets
      };

      return {
        confidence,
        data,
        processingTime: performance.now() - startTime,
        source: 'smart-wallet-module',
        version: this.config.version
      };
    } catch (error) {
      context.logger.error('Smart wallet signal failed:', error);
      
      return {
        confidence: 0,
        data: {
          detected: false,
          confidence: 0,
          tier1Count: 0,
          tier2Count: 0,
          tier3Count: 0,
          overlapCount: 0,
          totalWeight: 0,
          walletAddresses: []
        },
        processingTime: performance.now() - startTime,
        source: 'smart-wallet-module',
        version: this.config.version
      };
    }
  }

  private async checkWalletTokenActivity(walletAddress: string, tokenAddress: string, rpcManager: any): Promise<boolean> {
    try {
      const tokenAccounts = await rpcManager.getTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { mint: new PublicKey(tokenAddress) },
        'chainstack'
      );
      const holdsToken = tokenAccounts.some((account: any) =>
        account.account?.data?.parsed?.info?.mint === tokenAddress
      );
      
      if (holdsToken) return true;
      
      const signatures = await rpcManager.getSignaturesForAddress(walletAddress, 10);
      const recent24h = signatures.filter((sig: any) => {
        const sigTime = sig.blockTime || 0;
        const hours24Ago = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        return sigTime >= hours24Ago;
      });
      
      for (const sig of recent24h.slice(0, 20)) {
        try {
          const tx = await rpcManager.getTransaction(sig.signature);
          const txString = JSON.stringify(tx);
          if (txString.includes(tokenAddress)) {
            return true;
          }
        } catch (error) {
          continue;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}
