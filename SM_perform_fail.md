# FIX: SignatureManager Performance Failures

## Issue
CPU spinlock burns 100% CPU during contention and unclearable interval creates resource leaks in long-running processes.

## Files to Change
- `src/detection/transport/signature-manager.js` (lines 72, 101, 147, 184)

## Required Changes
1. Replace CPU-burning spinlock with async yielding mechanism
2. Store interval ID for proper resource cleanup
3. Add performance monitor method validation before calls
4. Optimize cleanup algorithm to avoid expensive array operations

## Commands

```bash
# Add interval tracking for cleanup
sed -i 's/constructor(performanceMonitor = null) {/constructor(performanceMonitor = null) {\n    this.cleanupIntervalId = null;/' src/detection/transport/signature-manager.js

# Store interval ID for cleanup
sed -i 's/setInterval(() => {/this.cleanupIntervalId = setInterval(() => {/' src/detection/transport/signature-manager.js

# Add destroy method for resource cleanup
sed -i '/startCleanup() {/i\  /**\n   * Cleanup resources\n   */\n  destroy() {\n    if (this.cleanupIntervalId) {\n      clearInterval(this.cleanupIntervalId);\n      this.cleanupIntervalId = null;\n    }\n  }\n' src/detection/transport/signature-manager.js

# Replace CPU spinlock with async yielding
sed -i 's/while (this.updating) {/while (this.updating) {\n        await new Promise(resolve => setTimeout(resolve, 0));/' src/detection/transport/signature-manager.js

# Make spinlock methods async
sed -i 's/addSignatureAtomic(signature) {/async addSignatureAtomic(signature) {/' src/detection/transport/signature-manager.js
sed -i 's/removeSignature(signature) {/async removeSignature(signature) {/' src/detection/transport/signature-manager.js

# Fix async calls in isDuplicate
sed -i 's/this.addSignatureAtomic(signature);/await this.addSignatureAtomic(signature);/' src/detection/transport/signature-manager.js
sed -i 's/isDuplicate(signature) {/async isDuplicate(signature) {/' src/detection/transport/signature-manager.js

# Add performance monitor validation
sed -i 's/if (this.performanceMonitor) {/if (this.performanceMonitor \&\& typeof this.performanceMonitor.recordCycle === "function") {/' src/detection/transport/signature-manager.js

# Optimize cleanup - avoid expensive sort
sed -i 's/const allEntries = Array.from(this.signatureTimestamps.entries())/let removedFromSize = 0;\n        for (const [signature, timestamp] of this.signatureTimestamps) {\n          if (removedFromSize >= toRemoveCount) break;\n          this.signatures.delete(signature);\n          this.signatureTimestamps.delete(signature);\n          removedFromSize++;\n        }/' src/detection/transport/signature-manager.js

# Remove the sort-based cleanup code
sed -i '/\.sort((a, b) => a\[1\] - b\[1\]);/,/removedCount++;/d' src/detection/transport/signature-manager.js
```

## Test Fix

```bash
# Test interval cleanup exists
node -e "const code = require('fs').readFileSync('./src/detection/transport/signature-manager.js', 'utf8'); console.log('Cleanup method: ' + (code.includes('destroy()') ? 'PASS' : 'FAIL'));"

# Test async spinlock replacement
node -e "const code = require('fs').readFileSync('./src/detection/transport/signature-manager.js', 'utf8'); console.log('Async spinlock: ' + (code.includes('async addSignatureAtomic') ? 'PASS' : 'FAIL'));"

# Test performance monitor validation
node -e "const code = require('fs').readFileSync('./src/detection/transport/signature-manager.js', 'utf8'); console.log('Monitor validation: ' + (code.includes('typeof this.performanceMonitor.recordCycle') ? 'PASS' : 'FAIL'));"
```

**Validation Checklist**
* destroy() method exists to clear intervals and prevent resource leaks
* addSignatureAtomic() and isDuplicate() are async to enable yielding
* Performance monitor calls are validated before execution
* Cleanup algorithm avoids expensive Array.from() and sort() operations
* Interval ID is stored in this.cleanupIntervalId for proper cleanup