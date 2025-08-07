#!/usr/bin/env node

/**
 * Demo of rate limiting behavior
 */

console.log('🧪 RATE LIMITING BEHAVIOR DEMO');
console.log('📍 Demonstrating exponential backoff on 429 errors\n');

// Simulate the rate limit logic
async function simulateRateLimitHandling() {
    console.log('Simulating RPC calls with rate limiting...\n');
    
    const maxRetries = 5;
    let rateLimitHits = 0;
    
    for (let i = 0; i < maxRetries; i++) {
        console.log(`\n--- Attempt ${i + 1}/${maxRetries} ---`);
        
        try {
            // Simulate RPC call
            console.log('📡 Making RPC call...');
            
            // Simulate rate limit on first 2 attempts
            if (i < 2) {
                const error = new Error('Too Many Requests');
                error.status = 429;
                throw error;
            }
            
            // Success on 3rd attempt
            console.log('✅ RPC call successful!');
            return { success: true };
            
        } catch (error) {
            // Rate limit handling
            if (error.status === 429) {
                const rateLimitDelay = Math.min(2000 * Math.pow(2, i), 30000);
                console.log(`⏳ Rate limited, waiting ${rateLimitDelay}ms before retry ${i + 1}/${maxRetries}`);
                rateLimitHits++;
                console.log(`  📊 Rate limit hits: ${rateLimitHits}`);
                
                // Wait for backoff
                const startWait = Date.now();
                await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
                const waitTime = Date.now() - startWait;
                console.log(`  ⏱️  Actually waited: ${waitTime}ms`);
                
                continue; // Skip normal retry logic
            }
            
            // Other errors would go through normal retry logic
            console.log('❌ Other error:', error.message);
        }
    }
    
    return { success: false, rateLimitHits };
}

// Run the simulation
simulateRateLimitHandling().then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RATE LIMITING DEMO RESULTS');
    console.log('='.repeat(60));
    console.log(`Success: ${result.success}`);
    console.log(`Total rate limit hits: ${result.rateLimitHits || 0}`);
    console.log('\n🎯 KEY BEHAVIORS:');
    console.log('  1. First rate limit: Wait 2 seconds');
    console.log('  2. Second rate limit: Wait 4 seconds');
    console.log('  3. Third attempt: Success (no rate limit)');
    console.log('  4. Total wait time: ~6 seconds for rate limits');
    console.log('  5. Skips normal retry delays when rate limited');
}).catch(console.error);