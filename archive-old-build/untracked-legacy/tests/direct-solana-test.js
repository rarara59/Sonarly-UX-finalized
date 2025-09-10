console.log('🧪 Testing direct Solana connection...');

try {
  const { Connection } = await import('@solana/web3.js');
  
  console.log('📡 Creating direct Solana connection...');
  const connection = new Connection('https://mainnet.helius-rpc.com', 'confirmed');
  
  console.log('🔍 Testing getVersion...');
  const version = await connection.getVersion();
  console.log('✅ Version:', version);
  
  console.log('🔍 Testing getEpochInfo...');
  const epochInfo = await connection.getEpochInfo();
  console.log('✅ Epoch:', epochInfo.epoch, 'Slot:', epochInfo.slotIndex);
  
  console.log('🎉 Direct Solana connection works!');
  
} catch (error) {
  console.error('❌ Direct connection failed:', error.message);
}

process.exit(0);
