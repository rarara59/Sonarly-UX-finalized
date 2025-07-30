// src/services/transfer-logger.service.ts

import Transfer from '../models/transfer';
import { logger } from '../utils/logger';

interface RawTransferEvent {
  wallet: string;
  token: string;
  amount: number;
  usdValue: number;
  direction: 'buy' | 'sell';
  timestamp: Date;
  tier: number;
  source: string;
}

export class TransferLoggerService {
  static async saveTransfers(events: RawTransferEvent[]) {
    if (!events.length) return;

    try {
      const records = events.map(evt => ({
        wallet: evt.wallet,
        token: evt.token,
        amount: evt.amount,
        usdValue: evt.usdValue,
        direction: evt.direction,
        timestamp: evt.timestamp,
        tier: evt.tier,
        source: evt.source,
      }));

      await Transfer.insertMany(records, { ordered: false });
      logger.info(`[TransferLogger] Saved ${records.length} transfers.`);
    } catch (err) {
      logger.error('[TransferLogger] Failed to save transfers', err);
    }
  }
}
