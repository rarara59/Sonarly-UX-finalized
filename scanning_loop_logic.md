rafaltracz@Rafals-MacBook-Air thorpv1 % grep -n -A 10 "Scanning for new LP" ./src/**/*.js
./src/services/liquidity-pool-creation-detector.service 2.js:297:      console.log('🔍 Scanning for new LP creations...');
./src/services/liquidity-pool-creation-detector.service 2.js-298-      
./src/services/liquidity-pool-creation-detector.service 2.js-299-      // Get recent transactions for Raydium AMM
./src/services/liquidity-pool-creation-detector.service 2.js-300-      const recentSignatures = await this.rpcManager.call('getSignaturesForAddress', [
./src/services/liquidity-pool-creation-detector.service 2.js-301-        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM program ID
./src/services/liquidity-pool-creation-detector.service 2.js-302-        {
./src/services/liquidity-pool-creation-detector.service 2.js-303-          limit: this.lpScannerConfig.maxTransactionsPerScan || 10,
./src/services/liquidity-pool-creation-detector.service 2.js-304-          commitment: 'confirmed'
./src/services/liquidity-pool-creation-detector.service 2.js-305-        }
./src/services/liquidity-pool-creation-detector.service 2.js-306-      ], { priority: 'high' });
./src/services/liquidity-pool-creation-detector.service 2.js-307-      
--
./src/services/liquidity-pool-creation-detector.service 3.js:297:      console.log('🔍 Scanning for new LP creations...');
./src/services/liquidity-pool-creation-detector.service 3.js-298-      
./src/services/liquidity-pool-creation-detector.service 3.js-299-      // Get recent transactions for Raydium AMM
./src/services/liquidity-pool-creation-detector.service 3.js-300-      const recentSignatures = await this.rpcManager.call('getSignaturesForAddress', [
./src/services/liquidity-pool-creation-detector.service 3.js-301-        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM program ID
./src/services/liquidity-pool-creation-detector.service 3.js-302-        {
./src/services/liquidity-pool-creation-detector.service 3.js-303-          limit: this.lpScannerConfig.maxTransactionsPerScan || 10,
./src/services/liquidity-pool-creation-detector.service 3.js-304-          commitment: 'confirmed'
./src/services/liquidity-pool-creation-detector.service 3.js-305-        }
./src/services/liquidity-pool-creation-detector.service 3.js-306-      ], { priority: 'high' });
./src/services/liquidity-pool-creation-detector.service 3.js-307-      
--
./src/services/liquidity-pool-creation-detector.service-old.js:317:      console.log('🔍 Scanning for new LP creations...');
./src/services/liquidity-pool-creation-detector.service-old.js-318-      
./src/services/liquidity-pool-creation-detector.service-old.js-319-      const allSignatures = [];
./src/services/liquidity-pool-creation-detector.service-old.js-320-      
./src/services/liquidity-pool-creation-detector.service-old.js-321-      // Scan Raydium (if enabled)
./src/services/liquidity-pool-creation-detector.service-old.js-322-      if (this.lpScannerConfig.enableRaydiumDetection !== false) {
./src/services/liquidity-pool-creation-detector.service-old.js-323-        try {
./src/services/liquidity-pool-creation-detector.service-old.js-324-          const raydiumSigs = await this.rpcManager.call('getSignaturesForAddress', [
./src/services/liquidity-pool-creation-detector.service-old.js-325-            '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
./src/services/liquidity-pool-creation-detector.service-old.js-326-            { limit: 20, commitment: 'confirmed' }
./src/services/liquidity-pool-creation-detector.service-old.js-327-          ], { priority: 'high' });
--
./src/services/liquidity-pool-creation-detector.service.js:365:      safeConsole.log('🔍 Scanning for new LP creations...');
./src/services/liquidity-pool-creation-detector.service.js-366-      
./src/services/liquidity-pool-creation-detector.service.js-367-      const allSignatures = [];
./src/services/liquidity-pool-creation-detector.service.js-368-      
./src/services/liquidity-pool-creation-detector.service.js-369-      // Scan Raydium (if enabled)
./src/services/liquidity-pool-creation-detector.service.js-370-      if (this.lpScannerConfig.enableRaydiumDetection !== false) {
./src/services/liquidity-pool-creation-detector.service.js-371-        try {
./src/services/liquidity-pool-creation-detector.service.js-372-          const raydiumSigs = await this.rpcManager.call('getSignaturesForAddress', [
./src/services/liquidity-pool-creation-detector.service.js-373-            '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
./src/services/liquidity-pool-creation-detector.service.js-374-            { limit: 20, commitment: 'confirmed' }
./src/services/liquidity-pool-creation-detector.service.js-375-          ], { priority: 'high' });