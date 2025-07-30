// src/scripts/find-tier1-token-match.ts

import mongoose from 'mongoose';
import SmartWallet from '../models/smartWallet';
import Transfer from '../models/transfer'; // Ensure this model exists
import { config } from '../config/app-config';

(async () => {
  await mongoose.connect(config.database.uri);

  const token = 'So11111111111111111111111111111111111111112'; // Replace this with a token address you're tracking

  const tier1Wallets = await SmartWallet.find({ 'tierMetrics.tier': 1 }).lean();
  const tier1Addresses = tier1Wallets.map(w => w.address);

  const matches = await Transfer.aggregate([
    { $match: { tokenAddress: token, from: { $in: tier1Addresses } } },
    { $group: { _id: '$from', count: { $sum: 1 } } }
  ]);

  console.log('Tier 1 matches for token:', token);
  console.log(matches);

  await mongoose.disconnect();
})();