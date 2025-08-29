Functional Verification
Replace the old file and test:

# Backup original
cp src/detection/transport/rpc-connection-pool.js src/detection/transport/rpc-connection-pool-backup.js

# Replace with v2
cp src/detection/transport/rpc-connection-pool-v2.js src/detection/transport/rpc-connection-pool.js

# Test basic functionality
node -e "
import('./src/detection/transport/rpc-connection-pool.js').then(module => {
  const pool = new module.default();
  return pool.call('getSlot', []);
}).then(result => {
  console.log('✅ V2 basic test passed, slot:', result);
}).catch(err => {
  console.error('❌ V2 basic test failed:', err.message);
});"

Performance Test with V2
Run the stress test to see if performance improved:

node scripts/stress-test-rpc-connection-pool.js | grep -A 10 "PERFORMANCE VERDICT"

Expected improvements:

P95 latency closer to <30ms target
Success rates >95% under load
Better per-endpoint distribution

If any validation fails, the v2 file is missing required components and needs additional fixes.