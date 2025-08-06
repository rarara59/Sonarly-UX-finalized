/**
 * Pool Parser Worker - CPU-Only Binary Parsing
 * Target: Parse Raydium/Orca pool data without blocking main thread
 * 100 lines - Simple, focused, fast
 */

import { parentPort, workerData, isMainThread } from 'worker_threads';

// Safety guard
if (isMainThread || !parentPort) {
  console.error('Pool parser must run as worker thread');
  process.exit(1);
}

const workerId = workerData?.workerId ?? 'unknown';

// Error handling
process.on('uncaughtException', (err) => {
  console.error(`Worker ${workerId} uncaught exception:`, err);
  parentPort?.postMessage({
    taskId: 0,
    error: `Uncaught exception: ${err.message}`
  });
});

// Message handler
parentPort.on('message', async (message) => {
  const { taskId, type, data } = message;
  
  try {
    let result;
    
    if (type === 'parsePool') {
      result = parsePoolData(data);
    } else {
      throw new Error(`Unknown task type: ${type}`);
    }
    
    parentPort.postMessage({
      taskId,
      result
    });
    
  } catch (error) {
    parentPort.postMessage({
      taskId,
      error: error.message
    });
  }
});

/**
 * Parse pool data - main function
 */
function parsePoolData(data) {
  const { poolType, accountDataBuffer, layoutConstants } = data;
  
  if (!accountDataBuffer) {
    throw new Error('Missing account data buffer');
  }
  
  const buffer = Buffer.from(accountDataBuffer);
  
  switch (poolType) {
    case 'raydium':
      return parseRaydiumPool(buffer, layoutConstants);
    case 'orca':
      return parseOrcaPool(buffer, layoutConstants);
    default:
      throw new Error(`Unknown pool type: ${poolType}`);
  }
}

/**
 * Parse Raydium AMM pool
 */
function parseRaydiumPool(buffer, constants) {
  if (buffer.length < 752) {
    throw new Error(`Invalid Raydium pool data: ${buffer.length} bytes`);
  }
  
  try {
    const status = readUInt64LE(buffer, constants.STATUS_OFFSET || 0);
    const baseDecimals = readUInt64LE(buffer, constants.BASE_DECIMALS_OFFSET || 16);
    const quoteDecimals = readUInt64LE(buffer, constants.QUOTE_DECIMALS_OFFSET || 24);
    
    // Extract mint addresses as byte arrays
    const baseMintBytes = Array.from(buffer.slice(400, 432));
    const quoteMintBytes = Array.from(buffer.slice(432, 464));
    
    // Extract vault addresses
    const baseVaultBytes = Array.from(buffer.slice(464, 496));
    const quoteVaultBytes = Array.from(buffer.slice(496, 528));
    
    return {
      poolType: 'raydium',
      isValid: Number(status) === 6, // Raydium initialized status
      baseMintBytes,
      quoteMintBytes,
      baseVaultBytes,
      quoteVaultBytes,
      baseDecimals: Number(baseDecimals),
      quoteDecimals: Number(quoteDecimals),
      status: Number(status),
      parsedAt: Date.now()
    };
    
  } catch (error) {
    throw new Error(`Raydium parsing failed: ${error.message}`);
  }
}

/**
 * Parse Orca Whirlpool
 */
function parseOrcaPool(buffer, constants) {
  if (buffer.length < 653) {
    throw new Error(`Invalid Orca pool data: ${buffer.length} bytes`);
  }
  
  try {
    const liquidity = readUInt128LE(buffer.slice(181, 197));
    const sqrtPriceX64 = readUInt128LE(buffer.slice(165, 181));
    const tickCurrentIndex = buffer.readInt32LE(161);
    
    // Extract token mints
    const tokenMintABytes = Array.from(buffer.slice(101, 133));
    const tokenMintBBytes = Array.from(buffer.slice(181, 213));
    
    return {
      poolType: 'orca',
      isValid: liquidity > 0n,
      tokenMintABytes,
      tokenMintBBytes,
      liquidity: liquidity.toString(),
      sqrtPriceX64: sqrtPriceX64.toString(),
      tickCurrentIndex,
      parsedAt: Date.now()
    };
    
  } catch (error) {
    throw new Error(`Orca parsing failed: ${error.message}`);
  }
}

/**
 * Read 64-bit little-endian integer
 */
function readUInt64LE(buffer, offset) {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return (BigInt(high) << 32n) + BigInt(low);
}

/**
 * Read 128-bit little-endian integer
 */
function readUInt128LE(buffer) {
  const low = readUInt64LE(buffer, 0);
  const high = readUInt64LE(buffer, 8);
  return (high << 64n) + low;
}

console.log(`Pool parser worker ${workerId} ready`);