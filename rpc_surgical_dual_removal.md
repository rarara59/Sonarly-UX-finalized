# FIX: Remove Academic Complexity

## Issue
250+ lines of academic over-engineering creating unnecessary complexity and potential failure modes in production trading system.

## Files to Change
- `rpc-connection-pool.js` (remove parallel scanning extensions, keep Renaissance core)

## Required Changes
1. Remove parallelScan() method and all related parallel execution logic
2. Remove scanWithCursors() method with broken cursor pagination  
3. Remove scanForTransactions() method with complex multi-address handling
4. Remove helper methods: isTransactionScanMethod(), mergeTransactionResults()
5. Clean up any references to removed methods

## Commands

```bash
# Remove parallelScan() method (lines ~370-450)
sed -i '/RENAISSANCE ENHANCEMENT: Parallel RPC scanning/,/^  }$/d' rpc-connection-pool.js

# Remove isTransactionScanMethod() helper
sed -i '/Check if method benefits from parallel scanning/,/^  }$/d' rpc-connection-pool.js

# Remove mergeTransactionResults() helper  
sed -i '/Merge and deduplicate transaction results/,/^  }$/d' rpc-connection-pool.js

# Remove scanWithCursors() method
sed -i '/Scan for transactions using cursor-based pagination/,/^  }$/d' rpc-connection-pool.js

# Remove scanForTransactions() method
sed -i '/Enhanced transaction scanning with automatic cursor-based pagination/,/^  }$/d' rpc-connection-pool.js

# Remove any leftover comment blocks about parallel scanning
sed -i '/\/\*\*/,/\*\//d' rpc-connection-pool.js

# Clean up any double blank lines created by removals
sed -i '/^$/N;/^\n$/d' rpc-connection-pool.js
```

## Test Fix

```bash
# Verify module loads without syntax errors
node -e "
try { 
  const { RpcConnectionPool } = require('./rpc-connection-pool.js');
  console.log('✅ Module loads successfully');
} catch(e) { 
  console.log('❌ Module broken:', e.message); 
}
"

# Check line count reduction (should be ~450 lines vs ~700)
wc -l rpc-connection-pool.js

# Verify core methods still present
grep -n "async call(" rpc-connection-pool.js && echo "✅ Core call() method preserved"
grep -n "selectBestEndpoint" rpc-connection-pool.js && echo "✅ Failover logic preserved"
```

**Validation Checklist**
* Module loads without syntax errors after complexity removal
* File reduced from ~700 to ~450 lines (35% reduction)
* Core call() method and failover logic preserved intact
* All parallel scanning methods completely removed
* No references to removed methods remain in code