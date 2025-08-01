#!/usr/bin/env node

/**
 * Debug script to find upstream corruption of Pump.fun accounts
 */

import { Connection, PublicKey } from '@solana/web3.js';

const HARDCODED_ADDRESS = '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf';
const PUMP_FUN_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

async function debugTransaction(signature) {
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    console.log(`\n🔍 Debugging transaction: ${signature}`);
    console.log('='.repeat(80));
    
    // Fetch with jsonParsed encoding
    console.log('\n1️⃣ Fetching with jsonParsed encoding...');
    const parsedTx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
    });
    
    if (!parsedTx) {
        console.log('❌ Transaction not found');
        return;
    }
    
    // Check instructions
    const instructions = parsedTx.transaction.message.instructions;
    console.log(`Found ${instructions.length} instructions`);
    
    // Look for Pump.fun instructions
    instructions.forEach((ix, idx) => {
        if (ix.programId.toString() === PUMP_FUN_PROGRAM) {
            console.log(`\n📍 Pump.fun instruction at index ${idx}:`);
            console.log(`  Program: ${ix.programId}`);
            console.log(`  Accounts: ${JSON.stringify(ix.accounts, null, 2)}`);
            console.log(`  Data: ${ix.data}`);
            
            // Check if hardcoded address appears
            if (ix.accounts && ix.accounts.includes(HARDCODED_ADDRESS)) {
                console.log(`  ⚠️ FOUND HARDCODED ADDRESS at position ${ix.accounts.indexOf(HARDCODED_ADDRESS)}`);
            }
            
            // Check account types
            console.log('  Account types:');
            ix.accounts?.forEach((acc, i) => {
                console.log(`    [${i}] ${typeof acc}: ${acc}`);
            });
        }
    });
    
    // Fetch with base64 encoding for comparison
    console.log('\n2️⃣ Fetching with base64 encoding...');
    const base64Response = await connection._rpcRequest('getTransaction', [signature, {
        encoding: 'base64',
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
    }]);
    
    if (base64Response.result) {
        const base64Tx = base64Response.result;
        console.log('✅ Got base64 transaction');
        console.log(`  Accounts: ${base64Tx.transaction.message.accountKeys.length} keys`);
        
        // Decode the transaction to compare
        // This would require full transaction deserialization
        console.log('  (Full base64 decoding would show actual account indices)');
    }
    
    // Check accountKeys
    console.log('\n3️⃣ Checking accountKeys array:');
    const accountKeys = parsedTx.transaction.message.accountKeys;
    accountKeys.forEach((key, idx) => {
        const keyStr = typeof key === 'string' ? key : key.pubkey;
        if (keyStr === HARDCODED_ADDRESS) {
            console.log(`  ⚠️ FOUND HARDCODED ADDRESS at accountKeys[${idx}]: ${keyStr}`);
        }
    });
}

// Test with a known Pump.fun transaction
const testSignature = process.argv[2] || 'YOUR_PUMP_FUN_TX_SIGNATURE_HERE';

debugTransaction(testSignature).catch(console.error);