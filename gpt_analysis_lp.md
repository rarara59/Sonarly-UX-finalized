from pathlib import Path, PurePosixPath, PurePath, Path
md_content = """
# CRITICAL FIXES: **LP Detection Black‑Out & 8 s Latency** (Renaissance Production Grade)

## Problem Analysis
Production logs show scans returning **0 candidates** because `parseRealLPCreationTransaction` is never invoked; the call site fails due to a missing export and a stray “`.`” that aborts the signature‑array build:

```ts
// liquidity_creation_detector_last_working.js :L14‑L16
allSignatures.push(.raydiumSigs.map(sig => ({ .sig, dex: 'Raydium' })));
// ‑> SyntaxError: Unexpected token '.'  (process exits before parser runs)
```

New code detects Pump.fun & Orca pools but each batch hangs **≈7.9 s**.  Log excerpt:

```
✅ Transaction fetched 3uTQfVDJ… (103 ms)
# 80 sequential calls → ~8 s wall‑clock
```

The stall is pure I/O (Helios `getTransaction` per signature).

## Current Broken Code
```ts
// detector/scan.ts
allSignatures.push(.raydiumSigs.map(sig => ({ .sig, dex: 'Raydium' })));  // <- fatal
…
await this.parseRealLPCreationTransaction(tx);  // fn undefined – never imported
```

## Renaissance‑Grade Fix

1. **Syntax & Entry‑Point Repair**
```diff
- allSignatures.push(.raydiumSigs.map(sig => ({ .sig, dex: 'Raydium' })));
+ allSignatures.push(...raydiumSigs.map(sig => ({ sig, dex: 'Raydium' })));
```

```ts
// parser/raydium.ts
import { AMM_PROGRAM_ID_V4 } from '../constants';   // "amm4gZ6rGNJWN6TPSvbMJn7q19pN53JGzpwgy2TD4r9j"

export async function parseRealLPCreationTransaction(
  tx: ParsedTransaction
): Promise<LPCandidate|null> {
  const ix = tx.transaction.message.instructions.find(i =>
    tx.transaction.message.accountKeys[i.programIdIndex].toBase58() === AMM_PROGRAM_ID_V4 &&
    i.data.startsWith('23')           // Raydium `Initialize2` discriminator
  );
  if (!ix) return null;
  // …decode pool, mints, supply, liquidity …
  return { pool: poolKey, dex: 'Raydium', score: 0.87 };
}
```

2. **Batch RPC Fetcher**
```ts
// services/fetcher.ts
const BATCH = 128;
for (const chunk of chunkArray(sigs, BATCH)) {
  const txs = await helius.rpc.getTransactions(chunk, { maxSupportedTransactionVersion: 0 });
  txs.forEach(tx => tx && redis.xadd('tx_raw', '*', 'data', msgpack.encode(tx)));
}
```

3. **Three‑Stage Pipeline (Docker‑Compose)**
```
collector  ->  redis  ->  fetcher  ->  redis  ->  analyzer
```

*Collector*: pushes WebSocket signatures.  
*Fetcher*: bulk RPC + msgpack; throughput target ≥1 k tx/s.  
*Analyzer*: CPU‑only; scores & publishes to `signals` stream.

4. **Guardrails**
* Prometheus metrics: `fetch_latency_ms`, `candidate_latency_ms`, `rpc_errors_total`  
* Circuit breaker trips if `fetch_latency_p99 > 400` or `error_ratio > .01`.

## Implementation Steps

```bash
# 1 – patch bug & add parser
git apply patches/fix_signature_and_parser.diff

# 2 – install deps
npm i ioredis msgpack-lite prom-client

# 3 – spin infra
docker compose up -d redis grafana prometheus

# 4 – build & start micro‑services
docker compose up --build collector fetcher analyzer
```

## Expected Performance

| Metric | Before | After |
|--------|--------|-------|
|Detection recall (Raydium)|0 %|≥ 80 % first‑block|
|End‑to‑end latency p99|7  900 ms|≤ 250 ms|
|RPC calls / scan|49 single|1 bulk|
|RPC cost / day*|$210|<$30|

\*Assumes 100 k sig/day, Helius pro plan.

## Validation Criteria
* Raydium tx `4BxAEBQ8a1LX…` yields candidate ≤ 300 ms after signature publish.  
* Prometheus: `candidate_latency_ms_p99 < 250`.  
* 24 h soak: zero `SyntaxError`, `TypeError undefined` or circuit‑breaker OPEN events.  
* ≥ 3 live profitable trades in first 48 h.

---
**Implementation Priority: Critical** — every missed first‑block entry costs ≈ $2‑3 k per meme coin; eight‑second latency forfeits entire edge.
"""

file_path = Path("/mnt/data/critical_fixes_lp_detection.md")
file_path.write_text(md_content)
file_path