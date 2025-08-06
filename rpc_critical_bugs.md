# FIX: RPC Pool Critical Bugs

## Issue
Broken cursor pagination logic and dead queue code causing transaction discovery failures and code maintainability issues.

## Files to Change
- `rpc-connection-pool.js` (lines 347-354, 583-590, cursor logic)

## Required Changes
1. Remove dead function queue handling code that's never used
2. Fix broken cursor pagination logic that sets but never uses cursor
3. Simplify cursor-based scanning to remove buggy unused logic
4. Clean up queue item type checking

## Commands

```bash
# Remove dead function queue handling code
sed -i '/Handle both old function format and new object format/,+3d' rpc-connection-pool.js
sed -i '/if (typeof item === '\''function'\'') {/,+2d' rpc-connection-pool.js

# Fix queue processing to only handle object format
sed -i 's/} else if (item && typeof item\.resolve === '\''function'\'') {/if (item \&\& typeof item.resolve === '\''function'\'') {/g' rpc-connection-pool.js

# Remove broken cursor logic that sets but never uses beforeCursor
sed -i '/Set cursor from last successful result/,+7d' rpc-connection-pool.js

# Clean up duplicate function check in queue monitoring
sed -i '/if (typeof item === '\''function'\'') return true;/d' rpc-connection-pool.js

# Simplify scanWithCursors to remove unused beforeCursor variable
sed -i 's/let beforeCursor = null;//g' rpc-connection-pool.js
sed -i '/\.\.\.(beforeCursor && { before: beforeCursor })/d' rpc-connection-pool.js
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

# Check dead code removal
grep -n "typeof item === 'function'" rpc-connection-pool.js && echo "❌ Dead function code still present" || echo "✅ Dead function code removed"

# Verify cursor logic is cleaned up
grep -n "beforeCursor" rpc-connection-pool.js && echo "❌ Broken cursor logic still present" || echo "✅ Cursor logic cleaned up"
```

**Validation Checklist**
* Module loads without syntax errors after changes
* Dead function queue handling code is completely removed
* Broken cursor pagination logic is eliminated
* Queue processing only handles object format consistently
* No remaining references to unused beforeCursor variable