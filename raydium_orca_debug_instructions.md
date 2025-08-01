# TASK: Debug and fix Raydium/Orca validation failures
# Problem: 100% RPC validation failures with "Invalid param: not a Token mint"
# All Raydium/Orca candidates reach validation but fail at RPC level

# TASK: Debug exact token addresses being sent to RPC validation
# In validateTokenWithRetry method, add comprehensive address debugging:
# Add this IMMEDIATELY before the RPC call:

console.log(`🔴 RAYDIUM/ORCA VALIDATION DEBUG:`, {
    step: 'about_to_call_rpc',
    tokenAddress: tokenAddress,
    addressLength: tokenAddress?.length,
    addressFormat: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tokenAddress),
    candidateType: 'raydium_or_orca',
    rpcEndpoint: this.rpcUrl || 'default',
    rpcMethod: 'getAccountInfo'  // or whatever method you're using
});

# Add this AFTER the RPC call but BEFORE retry logic:
console.log(`🔴 RPC RESPONSE DEBUG:`, {
    tokenAddress: tokenAddress,
    success: !!result,
    error: error?.message || 'none',
    errorCode: error?.code || 'none',
    responseType: typeof result,
    hasAccountInfo: !!(result?.value)
});

# TASK: Test token addresses with known working validation
# Add a control test with known Solana token mints:
# In the same validation method, add this test BEFORE your normal validation:

const knownTokenMints = [
    'So11111111111111111111111111111111111111112', // Wrapped SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'  // USDC
];

for (const testMint of knownTokenMints) {
    try {
        const testResult = await this.connection.getAccountInfo(new PublicKey(testMint));
        console.log(`✅ CONTROL TEST: ${testMint} → ${testResult ? 'SUCCESS' : 'NULL'}`);
    } catch (testError) {
        console.log(`❌ CONTROL TEST: ${testMint} → ERROR: ${testError.message}`);
    }
}

# TASK: Debug token extraction from Raydium/Orca transactions
# In the Raydium/Orca token extraction logic, add address source debugging:
# Add this where token addresses are extracted:

if (candidate.type === 'raydium_lp_creation' || candidate.type === 'orca_lp_creation') {
    console.log(`🔵 TOKEN EXTRACTION DEBUG:`, {
        type: candidate.type,
        extractedAddress: candidate.tokenMint || candidate.tokenAddress,
        extractionSource: 'accounts[?]', // specify which account index
        allAccountsPreview: accounts.slice(0, 5), // first 5 accounts
        instructionProgram: instruction.programId,
        accountsWithTokenKeyword: accounts.filter(acc => acc.toString().toLowerCase().includes('token'))
    });
}

# TASK: Alternative validation method test
# Add parallel validation using getTokenAccountsByOwner as backup:
# In validateTokenWithRetry, add this alternative test:

console.log(`🧪 ALTERNATIVE VALIDATION TEST:`);
try {
    // Test if it's a valid mint by checking for token accounts
    const tokenAccounts = await this.connection.getTokenAccountsByMint(new PublicKey(tokenAddress));
    console.log(`✅ ALT METHOD SUCCESS: Found ${tokenAccounts.value?.length || 0} token accounts for ${tokenAddress}`);
} catch (altError) {
    console.log(`❌ ALT METHOD FAILED: ${tokenAddress} → ${altError.message}`);
}

# TASK: Check if addresses are SPL tokens vs other account types
# Add account type detection:
try {
    const accountInfo = await this.connection.getAccountInfo(new PublicKey(tokenAddress));
    if (accountInfo) {
        console.log(`🔍 ACCOUNT TYPE DEBUG:`, {
            tokenAddress: tokenAddress,
            owner: accountInfo.owner.toString(),
            dataLength: accountInfo.data.length,
            isSplToken: accountInfo.owner.toString() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            isSystemProgram: accountInfo.owner.toString() === '11111111111111111111111111111111',
            lamports: accountInfo.lamports
        });
    }
} catch (typeError) {
    console.log(`❌ ACCOUNT TYPE CHECK FAILED: ${tokenAddress} → ${typeError.message}`);
}

# TASK: Test the validation debug
# Run for 90 seconds and capture comprehensive validation debugging:
node src/index.js 2>&1 | tee raydium_orca_debug.log

# TASK: Analyze the validation failures systematically
# Check token address quality:
grep "🔴 RAYDIUM/ORCA VALIDATION DEBUG" raydium_orca_debug.log
# Expected: Shows token addresses being sent to RPC with format validation

# Check RPC response patterns:
grep "🔴 RPC RESPONSE DEBUG" raydium_orca_debug.log
# Expected: Shows consistent error types and response patterns

# Verify control tests work:
grep "✅ CONTROL TEST" raydium_orca_debug.log
# Expected: Known token mints should validate successfully

# Check alternative validation method:
grep "ALT METHOD" raydium_orca_debug.log
# Expected: Shows if addresses are valid mints using different RPC method

# Check account type analysis:
grep "🔍 ACCOUNT TYPE DEBUG" raydium_orca_debug.log
# Expected: Shows if extracted addresses are actually SPL token mints

# Check token extraction quality:
grep "🔵 TOKEN EXTRACTION DEBUG" raydium_orca_debug.log
# Expected: Shows source of token addresses and extraction quality

# Key questions this will answer:
# 1. Are the extracted token addresses properly formatted Solana addresses?
# 2. Are they SPL token mints or some other type of account?
# 3. Does the RPC endpoint work with known good token mints?
# 4. Is the validation method correct for the account type?
# 5. Which account index contains the actual token mint address?