import mongoose from 'mongoose';
import SmartWallet from './legacy/smartWallet';
import { config } from './config/app-config';
import * as fs from 'fs';

(async () => {
  await mongoose.connect(config.database.uri);
  
  console.log("📖 Reading CSV with tier data...");
  const csvContent = fs.readFileSync('../data/Final_Master_Wallet_List_with_Explicit_Tiering.csv', 'utf8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  let updated = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const columns = line.split(',');
    const address = columns[0]?.trim();
    const finalTier = columns[3]?.trim(); // final_assigned_tier column
    
    if (address && finalTier) {
      // Extract tier number (1, 2, or 3) from "Tier 1", "Tier 2", etc.
      const tierMatch = finalTier.match(/Tier (\d+)/);
      if (tierMatch) {
        const tierNumber = parseInt(tierMatch[1]);
        await SmartWallet.updateOne(
          { address: address },
          { tier: tierNumber }
        );
        updated++;
        if (updated % 50 === 0) console.log(`✅ Updated ${updated} wallets...`);
      }
    }
  }
  
  console.log(`🎉 Updated ${updated} wallet tiers total`);
  
  // Verify the update
  const tierDist = await SmartWallet.aggregate([
    { $group: { _id: "$tier", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  console.log("🏆 New tier distribution:", tierDist);
  
  // Sample updated wallets (with type casting)
  const samples = await SmartWallet.find({ tier: { $exists: true } }).limit(3);
  console.log("📝 Sample updated wallets:", samples.map((w: any) => ({
    address: w.address?.slice(0,8) + "...",
    tier: w.tier,
    isActive: w.isActive
  })));
  
  process.exit(0);
})();
