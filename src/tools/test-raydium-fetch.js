import { Connection, PublicKey } from '@solana/web3.js';

async function testFetch() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=17ee86cb-f234-493b-94a3-fb5d93f08874');
  const RAYDIUM_AMM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  
  console.log('Fetching recent Raydium transactions...');
  
  try {
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(RAYDIUM_AMM_V4),
      {
        limit: 5,
        commitment: 'confirmed'
      }
    );
    
    console.log(`Found ${signatures.length} signatures`);
    
    for (const sig of signatures) {
      console.log(`\nFetching transaction: ${sig.signature}`);
      
      const tx = await connection.getTransaction(sig.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx) {
        console.log('Transaction is null');
        continue;
      }
      
      console.log('Transaction structure:');
      console.log('- Has transaction:', !!tx.transaction);
      console.log('- Has meta:', !!tx.meta);
      console.log('- Has blockTime:', !!tx.blockTime);
      console.log('- Has slot:', !!tx.slot);
      
      if (tx.transaction) {
        console.log('- Transaction type:', typeof tx.transaction);
        console.log('- Has message:', !!tx.transaction.message);
        
        if (tx.transaction.message) {
          console.log('- Message structure:');
          console.log('  - Has accountKeys:', !!tx.transaction.message.accountKeys);
          console.log('  - Has staticAccountKeys:', !!tx.transaction.message.staticAccountKeys);
          console.log('  - Has instructions:', !!tx.transaction.message.instructions);
          console.log('  - Has compiledInstructions:', !!tx.transaction.message.compiledInstructions);
          
          // Try to get account keys
          let accountKeys;
          if (tx.transaction.message.staticAccountKeys) {
            accountKeys = tx.transaction.message.staticAccountKeys;
            console.log(`  - Found ${accountKeys.length} static account keys`);
          } else if (tx.transaction.message.accountKeys) {
            accountKeys = tx.transaction.message.accountKeys;
            console.log(`  - Found ${accountKeys.length} account keys`);
          }
          
          // Try to get instructions
          const instructions = tx.transaction.message.compiledInstructions || tx.transaction.message.instructions;
          if (instructions) {
            console.log(`  - Found ${instructions.length} instructions`);
            
            // Find Raydium instructions
            let raydiumCount = 0;
            instructions.forEach((inst, idx) => {
              if (accountKeys && accountKeys[inst.programIdIndex] === RAYDIUM_AMM_V4) {
                raydiumCount++;
                console.log(`    - Instruction ${idx} is Raydium`);
                
                // Try to get data
                if (inst.data) {
                  const dataBuffer = Buffer.from(inst.data, 'base64');
                  if (dataBuffer.length > 0) {
                    const discriminator = dataBuffer[0].toString(16).padStart(2, '0');
                    console.log(`      - Discriminator: 0x${discriminator}`);
                    console.log(`      - Data length: ${dataBuffer.length}`);
                    console.log(`      - Account count: ${inst.accountKeyIndexes ? inst.accountKeyIndexes.length : inst.accounts?.length || 0}`);
                  }
                }
              }
            });
            console.log(`  - Found ${raydiumCount} Raydium instructions`);
          }
        }
      }
      
      console.log('---');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testFetch();