import mongoose from 'mongoose';
import { config } from '../config/app-config';

// Simple schema just for upload test
const TestWalletSchema = new mongoose.Schema({
  address: String,
  network: String,
  tierMetrics: {
    tier: Number,
    weight_multiplier: Number,
    priority: String
  },
  winRate: Number,
  totalPnL: Number
});

const TestWallet = mongoose.model('TestWallet', TestWalletSchema);

async function simpleSeed() {
  try {
    console.log('🚀 Testing MongoDB connection...');
    console.log('📍 URI:', config.database.uri);
    
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected!');
    
    // Insert one test wallet
    await TestWallet.create({
      address: "test123",
      network: "solana", 
      tierMetrics: { tier: 1, weight_multiplier: 5.0, priority: 'premium' },
      winRate: 0.95,
      totalPnL: 100000
    });
    
    console.log('✅ Test wallet inserted!');
    
    const count = await TestWallet.countDocuments();
    console.log(`📊 Total test wallets: ${count}`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

simpleSeed();