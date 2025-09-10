// src/manual-raydium-test.ts

import { Connection, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = new Connection(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);

  // Raydium V4 AMM Program ID (confirmed active)
  const programId = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
  const dataSize = 752; // Known size for Raydium V4 AMM pool accounts

  try {
    const accounts = await connection.getProgramAccounts(programId, {
      commitment: 'confirmed',
      encoding: 'jsonParsed',
      filters: [{ dataSize }]
    });

    console.log(`✅ Accounts found: ${accounts.length}`);
    if (accounts.length > 0) {
      console.log('🔍 Example account:', accounts[0].pubkey.toBase58());
    }
  } catch (err) {
    console.error('❌ Error fetching program accounts:', err);
  }
}

run();