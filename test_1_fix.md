src/services/tiered-token-filter.service.js

Update the null safety check around lines 415-420 in fetchTokenMetadataRobust method. Replace the current supplyResult processing with complete null safety that handles all failure scenarios including null supplyResult, missing data field, and NaN prevention.

REPLACE THIS

const supplyResult = await this.validateTokenWithRetry(tokenMint, 'supply');
if (supplyResult.success && supplyResult.data?.supply) {
    metadata.supply = parseInt(supplyResult.data?.supply?.amount || '0') || 0;
    metadata.decimals = parseInt(supplyResult.data?.supply?.decimals) || 9;
    metadata.isInitialized = true;
    console.log(`  ✅ Got token supply: ${supplyResult.data.supply.uiAmount}`);
} else {
    console.log(`  ⚠️ getTokenSupply failed after retries: ${supplyResult.error}`);
}

WITH THIS

const supplyResult = await this.validateTokenWithRetry(tokenMint, 'supply');
if (supplyResult?.success && supplyResult.data?.supply) {
    const amount = supplyResult.data.supply.amount;
    const decimals = supplyResult.data.supply.decimals;
    const uiAmount = supplyResult.data.supply.uiAmount;
    
    // Safe integer parsing with NaN protection
    metadata.supply = (amount && !isNaN(parseInt(amount))) ? parseInt(amount) : 0;
    metadata.decimals = (decimals && !isNaN(parseInt(decimals))) ? parseInt(decimals) : 9;
    metadata.isInitialized = true;
    
    console.log(`  ✅ Got token supply: ${uiAmount || 'unknown'}`);
} else {
    const errorMsg = supplyResult?.error || 'Invalid supply result structure';
    console.log(`  ⚠️ getTokenSupply failed after retries: ${errorMsg}`);
}