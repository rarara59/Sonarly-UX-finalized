import { Connection, PublicKey } from '@solana/web3.js';

async function findRaydiumLPCreations() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=17ee86cb-f234-493b-94a3-fb5d93f08874');
  const RAYDIUM_AMM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  
  console.log('🔍 Searching for Raydium LP creation transactions...');
  console.log('This may take a few minutes to find LP creations among all transactions...\n');
  
  let foundCount = 0;
  const targetCount = 10;
  let offset = 0;
  const batchSize = 100;
  
  while (foundCount < targetCount && offset < 5000) {
    try {
      console.log(`📊 Fetching batch starting at offset ${offset}...`);
      
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(RAYDIUM_AMM_V4),
        {
          limit: batchSize,
          commitment: 'confirmed'
        }
      );
      
      if (signatures.length === 0) {
        console.log('No more signatures available');
        break;
      }
      
      // Process in smaller batches to avoid rate limits
      const processBatchSize = 10;
      for (let i = 0; i < signatures.length && foundCount < targetCount; i += processBatchSize) {
        const batch = signatures.slice(i, Math.min(i + processBatchSize, signatures.length));
        
        const txPromises = batch.map(sig => 
          connection.getTransaction(sig.signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0
          }).catch(() => null)
        );
        
        const transactions = await Promise.all(txPromises);
        
        for (let j = 0; j < transactions.length && foundCount < targetCount; j++) {
          const tx = transactions[j];
          const sig = batch[j];
          
          if (!tx || !tx.transaction) continue;
          
          // Extract account keys
          let accountKeys;
          const message = tx.transaction.message;
          
          if (message.staticAccountKeys) {
            accountKeys = message.staticAccountKeys;
          } else if (message.accountKeys) {
            accountKeys = message.accountKeys.map(key => 
              typeof key === 'string' ? key : key.pubkey
            );
          } else {
            continue;
          }
          
          // Get instructions
          const instructions = message.compiledInstructions || message.instructions || [];
          
          for (const instruction of instructions) {
            const programIdIndex = instruction.programIdIndex;
            if (programIdIndex >= accountKeys.length) continue;
            
            const programId = accountKeys[programIdIndex];
            if (programId !== RAYDIUM_AMM_V4) continue;
            
            // Decode instruction data
            let dataBuffer;
            if (typeof instruction.data === 'string') {
              dataBuffer = Buffer.from(instruction.data, 'base64');
            } else if (Array.isArray(instruction.data)) {
              dataBuffer = Buffer.from(instruction.data);
            } else {
              continue;
            }
            
            if (dataBuffer.length === 0) continue;
            
            const discriminator = dataBuffer[0].toString(16).padStart(2, '0');
            const accountIndexes = instruction.accountKeyIndexes || instruction.accounts || [];
            
            // Check if this looks like an LP creation
            // LP creations typically have 16+ accounts and specific discriminators
            const lpCreationDiscriminators = ['e7', 'e8', 'e9', 'ea', 'eb', 'f8'];
            const swapDiscriminators = ['09', '0a', '0b', 'cc', 'e3'];
            
            if (lpCreationDiscriminators.includes(discriminator) && 
                accountIndexes.length >= 16 &&
                accountIndexes.length <= 25) {
              
              foundCount++;
              console.log(`\n✅ Found LP Creation #${foundCount}:`);
              console.log(`   Signature: ${sig.signature}`);
              console.log(`   Discriminator: 0x${discriminator}`);
              console.log(`   Account count: ${accountIndexes.length}`);
              console.log(`   Data length: ${dataBuffer.length} bytes`);
              console.log(`   Block time: ${new Date(tx.blockTime * 1000).toISOString()}`);
              
              // Try to identify token mints
              console.log(`   Analyzing accounts:`);
              const knownPrograms = new Set([
                'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                '11111111111111111111111111111111111111111112',
                'SysvarRent111111111111111111111111111111111',
                'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
              ]);
              
              const knownQuotes = new Map([
                ['So11111111111111111111111111111111111111112', 'SOL'],
                ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'],
                ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT']
              ]);
              
              accountIndexes.forEach((index, position) => {
                if (index < accountKeys.length) {
                  const address = accountKeys[index];
                  if (knownQuotes.has(address)) {
                    console.log(`     Position ${position}: ${address} (${knownQuotes.get(address)})`);
                  } else if (!knownPrograms.has(address)) {
                    // Might be a token mint or pool address
                    const preview = address.substring(0, 8) + '...';
                    console.log(`     Position ${position}: ${preview} (unknown)`);
                  }
                }
              });
              
              break; // Found in this transaction, move to next
            } else if (swapDiscriminators.includes(discriminator)) {
              // Skip swap transactions
              continue;
            }
          }
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      offset += batchSize;
      
    } catch (error) {
      console.error('Error in batch:', error.message);
      // Continue with next batch
      offset += batchSize;
    }
  }
  
  console.log(`\n📊 Summary: Found ${foundCount} LP creation transactions`);
  console.log('Analysis complete!');
}

findRaydiumLPCreations();