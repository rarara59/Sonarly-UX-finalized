import { Connection, PublicKey } from '@solana/web3.js';

// Example LP creation transactions from Raydium (found from blockchain explorers)
const knownLPCreations = [
  // These are example signatures of known Raydium LP creations
  // You can replace these with actual LP creation transactions you find
  '3QDvScSYCuAcsW6qVzegyrKKxfbbqQtrB1z6StNNsYodRTkfUVeTRWTEebhi7vuxsCoYYYRskCmtczibQJcsUJMf'
];

async function analyzeKnownLPCreation() {
  const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=17ee86cb-f234-493b-94a3-fb5d93f08874');
  const RAYDIUM_AMM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  
  console.log('🔍 Analyzing known Raydium LP creation transaction...\n');
  
  for (const signature of knownLPCreations) {
    console.log(`📊 Analyzing transaction: ${signature}`);
    
    try {
      const tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx) {
        console.log('❌ Transaction not found');
        continue;
      }
      
      console.log('✅ Transaction found');
      console.log(`   Block time: ${new Date(tx.blockTime * 1000).toISOString()}`);
      console.log(`   Slot: ${tx.slot}`);
      
      // Extract account keys
      let accountKeys;
      const message = tx.transaction.message;
      
      if (message.staticAccountKeys) {
        accountKeys = message.staticAccountKeys;
        console.log(`   Account keys: ${accountKeys.length} static keys`);
      } else if (message.accountKeys) {
        accountKeys = message.accountKeys.map(key => 
          typeof key === 'string' ? key : key.pubkey
        );
        console.log(`   Account keys: ${accountKeys.length} keys`);
      } else {
        console.log('❌ No account keys found');
        continue;
      }
      
      // Get instructions
      const instructions = message.compiledInstructions || message.instructions || [];
      console.log(`   Total instructions: ${instructions.length}`);
      
      // Find Raydium instructions
      console.log('\n   Raydium instructions:');
      instructions.forEach((instruction, idx) => {
        const programIdIndex = instruction.programIdIndex;
        if (programIdIndex >= accountKeys.length) return;
        
        const programId = accountKeys[programIdIndex];
        if (programId !== RAYDIUM_AMM_V4) return;
        
        console.log(`\n   📍 Instruction #${idx} (Raydium):`);
        
        // Decode instruction data
        let dataBuffer;
        if (typeof instruction.data === 'string') {
          dataBuffer = Buffer.from(instruction.data, 'base64');
        } else if (Array.isArray(instruction.data)) {
          dataBuffer = Buffer.from(instruction.data);
        }
        
        if (dataBuffer && dataBuffer.length > 0) {
          const discriminator = dataBuffer[0].toString(16).padStart(2, '0');
          console.log(`      Discriminator: 0x${discriminator}`);
          console.log(`      Data length: ${dataBuffer.length} bytes`);
          
          // Show first few bytes of data
          const preview = dataBuffer.slice(0, 20).toString('hex');
          console.log(`      Data preview: ${preview}...`);
        }
        
        const accountIndexes = instruction.accountKeyIndexes || instruction.accounts || [];
        console.log(`      Account count: ${accountIndexes.length}`);
        
        // Analyze account structure
        console.log(`      Account analysis:`);
        
        const knownPrograms = {
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
          '11111111111111111111111111111111111111111112': 'System Program',
          'SysvarRent111111111111111111111111111111111': 'Rent Sysvar',
          'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token',
          '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM V4',
          'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX': 'Serum Program'
        };
        
        const knownQuotes = {
          'So11111111111111111111111111111111111111112': 'SOL',
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
          'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT'
        };
        
        accountIndexes.forEach((index, position) => {
          if (index < accountKeys.length) {
            const address = accountKeys[index];
            
            if (knownPrograms[address]) {
              console.log(`         [${position}]: ${knownPrograms[address]}`);
            } else if (knownQuotes[address]) {
              console.log(`         [${position}]: ${address} (${knownQuotes[address]} - Quote Token)`);
            } else {
              // Check if it appears multiple times (likely pool address)
              const occurrences = accountIndexes.filter(i => i === index).length;
              if (occurrences > 1) {
                console.log(`         [${position}]: ${address.substring(0, 8)}... (appears ${occurrences} times - likely pool/AMM)`);
              } else {
                console.log(`         [${position}]: ${address.substring(0, 8)}... (unknown - likely token mint)`);
              }
            }
          }
        });
      });
      
      // Look for patterns
      console.log('\n   Pattern Analysis:');
      const raydiumInstructionCount = instructions.filter((inst) => {
        const pid = accountKeys[inst.programIdIndex];
        return pid === RAYDIUM_AMM_V4;
      }).length;
      
      console.log(`   - Raydium instructions: ${raydiumInstructionCount}`);
      console.log(`   - Other instructions: ${instructions.length - raydiumInstructionCount}`);
      
      // Check inner instructions
      if (tx.meta && tx.meta.innerInstructions) {
        console.log(`   - Inner instructions: ${tx.meta.innerInstructions.length} groups`);
      }
      
    } catch (error) {
      console.error(`❌ Error analyzing transaction: ${error.message}`);
    }
  }
}

analyzeKnownLPCreation();