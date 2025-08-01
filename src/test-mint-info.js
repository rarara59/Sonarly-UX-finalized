import { Connection, PublicKey } from '@solana/web3.js';

// Test addresses
const testAddresses = {
    'WSOL': 'So11111111111111111111111111111111111111112', // Wrapped SOL
    'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // Raydium
    'TESTToken': '4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf' // The failing token from logs
};

// RPC endpoints to test
const rpcEndpoints = [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
];

async function testGetMintInfo(rpcUrl, tokenAddress, tokenName) {
    console.log(`\n=== Testing ${tokenName} on ${rpcUrl} ===`);
    console.log(`Token Address: ${tokenAddress}`);
    
    try {
        const connection = new Connection(rpcUrl, 'confirmed');
        
        // Test 1: Basic getAccountInfo
        console.log('\n1. Testing getAccountInfo (raw):');
        const accountInfo = await connection.getAccountInfo(new PublicKey(tokenAddress));
        console.log(`   - Account exists: ${accountInfo !== null}`);
        if (accountInfo) {
            console.log(`   - Owner: ${accountInfo.owner.toBase58()}`);
            console.log(`   - Data length: ${accountInfo.data.length}`);
            console.log(`   - Lamports: ${accountInfo.lamports}`);
        }
        
        // Test 2: getAccountInfo with jsonParsed encoding
        console.log('\n2. Testing getAccountInfo (jsonParsed):');
        const parsedAccountInfo = await connection.getAccountInfo(
            new PublicKey(tokenAddress),
            { encoding: 'jsonParsed' }
        );
        console.log(`   - Account exists: ${parsedAccountInfo !== null}`);
        if (parsedAccountInfo && parsedAccountInfo.data.parsed) {
            console.log(`   - Type: ${parsedAccountInfo.data.parsed.type}`);
            console.log(`   - Program: ${parsedAccountInfo.data.program}`);
            if (parsedAccountInfo.data.parsed.info) {
                const info = parsedAccountInfo.data.parsed.info;
                console.log(`   - Decimals: ${info.decimals}`);
                console.log(`   - Supply: ${info.supply}`);
                console.log(`   - Mint Authority: ${info.mintAuthority || 'null (revoked)'}`);
                console.log(`   - Freeze Authority: ${info.freezeAuthority || 'null (revoked)'}`);
            }
        }
        
        // Test 3: Using getParsedAccountInfo (alternative method)
        console.log('\n3. Testing getParsedAccountInfo:');
        const parsedAccount = await connection.getParsedAccountInfo(new PublicKey(tokenAddress));
        console.log(`   - Account exists: ${parsedAccount.value !== null}`);
        if (parsedAccount.value && parsedAccount.value.data.parsed) {
            console.log(`   - Parsed data available: true`);
            console.log(`   - Full parsed data:`, JSON.stringify(parsedAccount.value.data.parsed, null, 2));
        }
        
        // Test 4: getTokenSupply
        console.log('\n4. Testing getTokenSupply:');
        try {
            const supply = await connection.getTokenSupply(new PublicKey(tokenAddress));
            console.log(`   - Supply: ${supply.value.uiAmount}`);
            console.log(`   - Decimals: ${supply.value.decimals}`);
        } catch (supplyError) {
            console.log(`   - Error: ${supplyError.message}`);
        }
        
        // Test 5: getTokenLargestAccounts
        console.log('\n5. Testing getTokenLargestAccounts:');
        try {
            const largestAccounts = await connection.getTokenLargestAccounts(new PublicKey(tokenAddress));
            console.log(`   - Number of accounts: ${largestAccounts.value.length}`);
            if (largestAccounts.value.length > 0) {
                console.log(`   - Largest holder: ${largestAccounts.value[0].uiAmount}`);
            }
        } catch (accountsError) {
            console.log(`   - Error: ${accountsError.message}`);
        }
        
    } catch (error) {
        console.error(`\n❌ Error testing ${tokenName}: ${error.message}`);
        console.error(`Stack trace:`, error.stack);
    }
}

async function runAllTests() {
    console.log('🔍 Starting Solana Mint Info Debug Tests...\n');
    
    // Test with the first RPC endpoint
    const primaryRpc = rpcEndpoints[0];
    
    // Test all addresses
    for (const [name, address] of Object.entries(testAddresses)) {
        await testGetMintInfo(primaryRpc, address, name);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    
    // Test the failing address with all RPC endpoints
    console.log('\n\n🔄 Testing failing address with all RPC endpoints...');
    const failingAddress = testAddresses.TESTToken;
    for (const rpc of rpcEndpoints) {
        await testGetMintInfo(rpc, failingAddress, 'TESTToken');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
}

// Run the tests
runAllTests().catch(console.error);