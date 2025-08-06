rafaltracz@Rafals-MacBook-Air thorpv1 % >....                                   
            console.log('🚀 MEME COIN FOUND! Transaction #' + transactionsProcessed);
          }
        }
      } catch (error) {
        console.log('⚠️ Transaction processing error:', error.message);
      }
    }
  });

  signalBus.on('candidateDetected', (candidate) => {
    console.log('💰 TRADING OPPORTUNITY:', candidate?.tokenAddress?.slice(0,8)); 
  });

  console.log('🚀 ACTIVATING LIVE TRANSACTION FEED...');

  if (typeof transactionFetcher.pollAllDexs === 'function') {
    await transactionFetcher.pollAllDexs();
    console.log('✅ Transaction polling ACTIVATED via pollAllDexs');
  } else {
    console.log('❌ TransactionFetcher missing pollAllDexs method');
    process.exit(1);
  }

  console.log('⏳ LIVE SYSTEM RUNNING - Processing real Solana transactions...');

  setTimeout(() => {
    console.log('\n📊 LIVE SYSTEM TEST COMPLETE');
    console.log('📡 Transactions processed:', transactionsProcessed);
    console.log('💰 Meme coins detected:', candidatesFound);
    process.exit(0);
  }, 120000);

}).catch(err => {
  console.log('❌ ACTIVATION FAILED:', err.message);
  process.exit(1);
});
"
🎯 FINAL ACTIVATION TEST: Live transaction processing
✅ Complete system loading...
🚀 Renaissance Raydium Detector initialized with production integrations
✅ Complete detection system ready
🚀 ACTIVATING LIVE TRANSACTION FEED...
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Failed to fetch transaction 2dG4etu9yvhFtpphieGnBaCbqcCdogHahhXnTz4z9cFyGMXGqc1iK7DoZd6MHFewa8vLnZ49c7LJqSfk9K1zjyt2: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Failed to fetch transaction 28x7MA56Urttuc1JG4GvBvZNp63RohzRwcgbstWEPxWyBcfUY9LR7mC1FxfmhoSQ2K6DFcBcyCCwE3C4LfWLgXQn: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Endpoint helius marked as degraded
Switched to endpoint: helius
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Failed to fetch transaction 2QNf67VQmk96YkGqkqDxYCX9K4mc45FBz6xeSYDKYCUrBjGXs9SN8aPskiRWYV1vceHWtqyMv7WBovjZac5kzNWr: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Failed to fetch transaction 2yuuU8yJFSXYFuTuMdbsPmDffhwuueaSrxBauz8yfsfcg9MAWf9o4DxpDUfYzXneF6adtLfan99drqmZsNmLJgJX: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Failed to fetch transaction 57a8Z41fu8ceWw9v5GWY9H1EUwURqF8ukEqN5J4iu56xnB2tcpZoruj1wSfDHJEumoGvFiDt4HRPp7W6cCoUM8Q4: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Error polling pumpfun: Error: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
    at RpcConnectionPool.executeCall (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/rpc-connection-pool.js:167:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async RpcConnectionPool.call (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/rpc-connection-pool.js:114:22)
    at async file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/transaction-fetcher.js:129:16
    at async CircuitBreaker.call (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/core/circuit-breaker.js:29:22)
    at async TransactionFetcher.pollDex (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/transaction-fetcher.js:128:24)
    at async Promise.all (index 1)
    at async TransactionFetcher.pollAllDexs (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/transaction-fetcher.js:62:49)
    at async [eval]:58:5
Endpoint helius recovered to healthy status
✅ Transaction polling ACTIVATED via pollAllDexs
⏳ LIVE SYSTEM RUNNING - Processing real Solana transactions...

📊 LIVE SYSTEM TEST COMPLETE
📡 Transactions processed: 0
💰 Meme coins detected: 0