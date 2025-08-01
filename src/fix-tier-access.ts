import mongoose from 'mongoose';
import SmartWallet from './legacy/smartWallet';
import { config } from './config/app-config';

(async () => {
  await mongoose.connect(config.database.uri);
  
  // Check current tier distribution using nested field
  const tierDist = await SmartWallet.aggregate([
    { $group: { _id: "$tierMetrics.tier", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log("🏆 Tier distribution (tierMetrics.tier):", tierDist);
  
  // Sample wallets with their nested tier
  const samples = await SmartWallet.find({}).limit(3);
  console.log("📝 Sample wallets:", samples.map((w: any) => ({
    address: w.address?.slice(0,8) + "...",
    tier: w.tierMetrics?.tier,
    topLevelTier: w.tier,
    isActive: w.isActive
  })));
  
  process.exit(0);
})();
