console.log('🧪 Testing import...');

try {
  const RPCConnectionManager = await import('../core/rpc-connection-manager/index.js');
  console.log('✅ Import successful!');
  console.log('✅ Test complete - exiting...');
} catch (error) {
  console.error('❌ Import failed:', error.message);
}

process.exit(0);
