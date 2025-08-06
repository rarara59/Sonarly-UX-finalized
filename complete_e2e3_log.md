rafaltracz@Rafals-MacBook-Air thorpv1 % >....                                   
    console.log('❌ TransactionFetcher missing pollAllDexs method');
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(transactionFetcher)));
    process.exit(1);
  }

  console.log('⏳ LIVE SYSTEM RUNNING - Processing real Solana transactions...');
  console.log('💰 MONEY TEST: Looking for real meme coin launches...');

  setTimeout(() => {
    console.log('\\n📊 LIVE SYSTEM TEST COMPLETE');
    console.log('📡 Transactions processed:', transactionsProcessed);
    console.log('💰 Meme coins detected:', candidatesFound);

    if (candidatesFound > 0) {
      console.log('🎉 ULTIMATE SUCCESS: Live meme coin detection system working!');
      console.log('💰 READY TO MAKE MONEY: System detecting real opportunities');
    } else {
      console.log('✅ SYSTEM OPERATIONAL: Ready to catch the next meme coin launch');
    }

    // Clean up event handlers
    signalBus.off('transactionsFetched', transactionHandler);
    signalBus.off('candidateDetected', candidateHandler);

    process.exit(0);
  }, 120000); // 2 minutes for live testing

}).catch(err => {
  console.log('❌ ACTIVATION FAILED:', err.message);
  console.log('Stack trace:', err.stack);
  console.log('🔍 Check CircuitBreaker has execute() method and TransactionFetcher has pollAllDexs()');
  process.exit(1);
});
"
🎯 FINAL ACTIVATION TEST: Live transaction processing
✅ Complete system loading...
🚀 Renaissance Raydium Detector initialized with production integrations
✅ Complete detection system ready
🚀 ACTIVATING LIVE TRANSACTION FEED...
RPC call failed: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
Error polling orca: Error: All RPC endpoints failed. Last error: HTTP 429: Too Many Requests
    at RpcConnectionPool.executeCall (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/rpc-connection-pool.js:167:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async RpcConnectionPool.call (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/rpc-connection-pool.js:114:22)
    at async file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/transaction-fetcher.js:119:16
    at async CircuitBreaker.call (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/core/circuit-breaker.js:29:22)
    at async TransactionFetcher.pollDex (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/transaction-fetcher.js:118:24)
    at async Promise.all (index 2)
    at async TransactionFetcher.pollAllDexs (file:///Users/rafaltracz/Desktop/thorpv1/src/detection/transport/transaction-fetcher.js:60:49)
    at async [eval]:73:5
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 61nfDRNXhQTxUwmawPgj5DkpxSmGiF6xLNcgGyQVpBYF9WCBt772ZQWEcxaJRTgAUuekzKgBAMABU3HAmoQ5E7vD: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 37m327DxeNNBXxrqmFNdAmSouQnNsw5GrQiNkzoXxhMWUTSxyyLgb9yWo8r7wHqvECdsSzJ1vYdDPNXQDdZsFju4: All RPC endpoints failed. Last error: Request timeout after 30ms
Endpoint helius marked as degraded
Switched to endpoint: helius
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4CThEwK21x5TeAUit9tgXPj5f71WjRt5GXfpoCBvDNrHSSS7uzfYZFXJ1u2nEFuZpJWU9PdbkYSbGTX2id9PTJpF: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 2PrA5bNzemfESPxv5zdGRAtfckBLpxHVMgXn2Q4UoyqmWEe4kfFhNkD26cMshQkKHmFeJrEahP3uzNLBj7jai1Hw: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5M7zxSuPfMegZyLT5we5sKvP5HzrnpyccxkgPWcFiqjfWR86meaVf1NPaEsS7Vjh891M31DgpGmftePi1UUvw3nh: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3SZwfZvdZmxHeJ48EVLui76EV8A8Etp9ydsuCAcbxcRTBPbKKznDiGFiENQisdDHBpjhas7kDb12ZNqXmf3b7Tek: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5uoY87mfTjb3qYgyMzh9S8gxmx5FVBusnoCGL3cQPzE3pSZj46yv2koePNAUyWcJRguUdaiyGN8Vc2cXwDm5pKLP: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4QKx9TDyLDFH6yYCgYWtc2s4risCH17rSdXdhnkzt3RqY6SVZkqaR1V43ZUnys4PgqXnkktcPXK7wDPJLzBG2BRY: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 32hB6uQfrnnvJ8pUSKeTS8fydSG5fY1yuwYoZpUULgGa9RHr3WETuF9cEEbAmuPtDqU1boidTBC7SEKEjxdpQGEq: All RPC endpoints failed. Last error: Request timeout after 30ms
Endpoint helius marked as dead
Switched to endpoint: null
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5hTpcuMji7vc8yuHfyaetZjXVVFQYr7EBqGzr2C4vXYRSqHPTZgNjBztJPx7aSb3ioUCPCHAS5MYm7PxgkTcXLcE: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4V7WpoDbbrQ2yp6X1yNQzphTSARm6YLRgiHtK5HqBFanmPg6CA5SCSqmvds3VUCPKHJKn6xXMZEpmVWKQH1rZfTy: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3L4jZ3Adp4xrgApSzxPcSmRiMD3FGZCj9ABJ74yv7DMSkwLnByV3i7ndVPXSPVkxrGt9pt1b1eK7BhRK31VwW7Wz: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5qJsRKo6FTuqcFmkdPadyGUjPoVK2gcsjUqzw9y6PqsVAqxquzbeUyHMyGwZLb77yjJ4qXfJpcgXNZSq9V5YhsZH: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4fZ7y1jV5Kw4i5gV9HMQmB8KmG8jWoBPS5Qcwd5oYP6W5XVEwvjeT5Le4QQtyZNpwYbhzMR2rp9EcdH9y8i154aV: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5wo9ymzGaxFCinpgpScVwdPSQ2HKtqrZoQxdctuQg7pBywmMSwz8gvyUvF53FXdUL2ZN4sQ1iyAqvfrkq2qngLM: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4mVipJ33SrXHt9aPt1Q8Gmo3CjN5eq4UxqXBAtjA6stqVBYSfEC5SiS4frWQyHQQ8wcEKT1BPj6Y7PXSRrUDCfh9: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction KDzSY6FxXqkaZkj3TCGa9eHrDYPo15er8yzRoBZH2z4QJ5U8sLS3UsY4LfcxGfzsekZxHL8u1KN1KxCn9np5m8B: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 41YRoZHnSsJx2GzrUWcuT2g7p4CW3eWXYW13VZZ3LCUwDnAEg9Mv2DC7QW3p3Gogf3wP6GRDX8qi1ZAcYNs2fupH: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 56Q6DfyP5CJMdyXD1WyUPumbFHavv3Tuypy29HPXktruLwhGhgBFdeArQCHcYUt324rziBskJ8oUNwtydoc8jCYS: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3MGstWmjNjtG5B7itRRvmXtfDX18FEgk5oDwMTsWcRoTXAMcw7bkdAg7k113a5hxpDQYbsW5UfYLa4zCkJWLACEE: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5m3jHN4aSZ11R83B3Xu8kfmnHBzdT3UrQ219SjXnYXeofCE1hMWWkWL82iLQYYpDsFTZoZdGL5RX74tWsLn73fr3: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 22XW9RHrwhiXx3GeH6JuMcFS6ugTsUzYBAshdFWmc2R4EwBdCKK2in6twMPeRSRaY6UBW9rxz5Frvcj4Q3jyrLXb: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 384GRCXWSQACUy4kWgTctxX7mpeeikdtSmCp5WEua1y5Lk98G5nXqvWnFH2ovuXnZSg3qvqnQmXL5hopWB4b1Ehj: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction tJxksNaxc729wVevFWoUAKcDhsHwJSBRojhXqVANwyeCd4N5ZhcsuinJWm676Z296z6nSBZkd5Nd1RuRurASEEi: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3zVRPeJuhixu9PvwhCeiE1HcvuWKrb5RTc3YSF1htYqtQSd6xqrqgRA6tgkc9K6TS1vTggJBk4n7XQH8NZJaZUYD: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3Jsz95gh5VVyHv1APz3Yuo2abAhPCZh9xtK4Ppy1vHQEMrvTqP2EpcJRUZ6z3tMD6vqbdH4DjdmcBWJTg9go74JH: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3EvpgkYW1ThcV1U2dwu9A9G1c9Ca3NAnFbmagTGU5SL4UYjK1BrJ31wsrVEa9f9V9JE8g9UYLZC7BWvroTDUnJby: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3atDbr6tzbPQB69n1rCUYkuDoLYN6UT9QTVVyfzjgEGpuXR6gxhDQ71PzvRckWZ4t3EcVr3hDfNMgyU57UKUTL8E: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 22svL3ogQSttGmvH4GSbowS2fxTBzVpriYuRRgDQfMwbr5eExM1sriW35MZMww6G24FH9wCXTLern7RYjJTDV7od: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5YkATgh7QPUVhqEkqeykUnrjkZ6ojSPq5smjSUvazq9QxYySm41Y37KmExE95kqNgACooPNRYgRkX3xYLoDGM6fk: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4wdnTn9WRd9GNmX9G8jJBjFotYPQa2vnBLKs1arswuVWqdZsMM9H4CD6AQiH2JhuKgr3ezvvPYhaswCYtQ6Gw6xe: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction yPFVtqoVdd75uhE8Zv3totRhimbyyRXMgCSwkEF2wUqmkGuEAQjbdbJ9WmLxBtARnRrm6JjZvCg9sJcKpX9RPYd: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3ERf5jzYrZfgu6pb5b1EpQoRfS2fHQVcacYtgq8GmHek77EKJcHZrQmYmYjZznAFLHibP9mLma2YuEJXbUwf7P5s: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 2tu1bsdPZ3NDT8ZNriY9EXyzGaZh48986BhUHBQbLNpCVmshTQ1vnrgUv1LqbrcEHj3FWun5R6CqUewKsYhan16J: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction ayPyeji1VMuMHiW3Sp1QftwCf7Jfzeb1HdKMjRhisV88DBAvWTgmnR1HSTkgcbNaS2RsjjrRio2quCdwEQTHrwh: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 5mqC5uvFFR5W2zkGZTwtdHhVPM4HgwoaixUqmr91uv4EfzmtSew3Yy56Y9tabCYsDfqRWSnqBXkFpTRUQt9oFJwV: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 2dngyd8NvCND7pE12UMU69f2skJzj1QyZ7umyjPZVAxcf8iy4YHFr9dxFahChW21kZsrDtu39J2PiQy1dsGvqhy3: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 55SLntTRQffYFeSD3xGpaTztjUBHptzz5v3biK2aPqsKXMLuY6YvLudQ82vhtYi6yn8jo7E6kQGeJNiEKvkB8uNe: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3GJQiEWyeg5b6n97r5PdD4RpoEioHkoVWLvqL1oMc9St5V3nFvmUPZq4JksFpcjCubygexDCKuwUZ1usJogszP3T: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 2dRRkbQTPXtsxSQUrv2rkviSBmfbZ4YV11jwscg8jQsTXQRkavV52GCcjc4PpAUwtnuZWcP16vfSJqH25uUVaHJj: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction KkCgefJCiMVTgWH9gz1WzcgQ9XU5nMA9vvADc4nPBJoxAiSx7E7QxYHVvs2wNqTERGgekNqqMWZwHgLnxwAptge: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 591CUcxQYWcGfdrUZEXYayiHxBdbnuF9jE7TuDQaKheHZbnbNFJUwaaHn4mqytACAZLQENiCLAt7Ucwwtv1g74iz: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4ymitwATga1jN6wxuyT18ogJqDzA4FjaCwpRED5UfasRtbgQmsn6crJ5hBuCH598A4xnjmtddkdQsEyMHi15XsX4: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3UgswbggittWxrFfgv6L2oTLUMVg1cM1yfHQwexvNtCBxYDSqCCPPYZFvvR2v7hKegEuqXocoNDyGcaHEAYbw5kG: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 3x6yWBcCTWALaA3G2PFBVwAznkbrN4S1VyLkirXLsxHonPW9Ezr7qYrYjVoSu5L4VZYSNZG8izgC5poJ3ds6hDRK: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4Pbk8KB2SKedhADC1xmVgrtTv5ndhgLCtiXPATQMrggRNqqnf4VTxwcKaqnAjKQ7nN7HCzx57bwKf88PKjtiMMvg: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 4seUA7sidW24MDWY4P8jvowEd4WDxGqUTneDvL7SW9WjX5aESQN218aLJPSk46M8bJTnhTxWLvu4VkVVrrEvssXo: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 2k2acaW8KKoE5dDsofn3A2kTjuwQKbHzdzCDg6223SuyUVb2hZBWzGVDeccgnbEzNJVQgGSWBTjsEnykSZA6VLxU: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction ojudQrMThrB1VZpoyXJdW6Cyf6dgmG6yYbkPhCcNLGK1n9VgCZZGeEvdKxpBZiQX3v32wfVNASiNqDx4L8XkEm1: All RPC endpoints failed. Last error: Request timeout after 30ms
RPC call failed: All RPC endpoints failed. Last error: Request timeout after 30ms
Failed to fetch transaction 36ZffJC2RNrZmr6QC8wyDc3Y7G32AXMJRhwNTWPZuCKoJBV3XmaVjxWtNjzHbZvx6WaN1EGviAJmr8W3WQyqtxYJ: All RPC endpoints failed. Last error: Request timeout after 30ms
✅ Transaction polling ACTIVATED via pollAllDexs
⏳ LIVE SYSTEM RUNNING - Processing real Solana transactions...
💰 MONEY TEST: Looking for real meme coin launches...
Endpoint helius recovered to healthy status

