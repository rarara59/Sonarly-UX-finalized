
import mongoose, { Schema, Document } from 'mongoose';

export interface TransferDocument extends Document {
  wallet: string; // the wallet address
  tokenAddress: string; // token interacted with
  txSignature: string; // transaction hash
  direction: 'buy' | 'sell'; // what direction the transfer was
  amount: number; // raw token amount
  usdValue: number; // estimated USD value at time of transfer
  timestamp: Date; // when it happened
  tier: number; // smart wallet tier at the time
  detectedBy: string; // 'helius', 'rpc', 'manual', etc.
  source: string; // source of token (e.g., Raydium, Jupiter)
}

const TransferSchema: Schema = new Schema({
  wallet: { type: String, required: true, index: true },
  tokenAddress: { type: String, required: true, index: true },
  txSignature: { type: String, required: true, index: true, unique: true },
  direction: { type: String, enum: ['buy', 'sell'], required: true },
  amount: { type: Number, required: true },
  usdValue: { type: Number, required: false },
  timestamp: { type: Date, required: true },
  tier: { type: Number, required: false },
  detectedBy: { type: String, required: false },
  source: { type: String, required: false }
}, { timestamps: true });

const Transfer = mongoose.model<TransferDocument>('Transfer', TransferSchema);
export default Transfer;