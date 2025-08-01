import { SolanaPoolParserService } from './src/services/solana-pool-parser.service.js';
import { CircuitBreakerService } from './src/services/circuit-breaker.service.js';
import { WorkerPoolManager } from './src/services/worker-pool-manager.service.js';

async function verifyFoundation() {
    console.log('=== FOUNDATION VERIFICATION ===');
    
    // Test 1: Circuit Breaker Basic Function
    console.log('\n1. Testing Circuit Breaker...');
    const circuitBreaker = new CircuitBreakerService('test-service');
    const testResult = await circuitBreaker.execute(async () => {
        return 'circuit-breaker-works';
    });
    console.log(`✓ Circuit Breaker: ${testResult}`);
    
    // Test 2: Solana Parser Service Methods
    console.log('\n2. Testing Solana Parser Service...');
    const parser = new SolanaPoolParserService();
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
    
    // Test 3: Worker Pool Basic Function
    console.log('\n3. Testing Worker Pool...');
    const workerPool = new WorkerPoolManager();
    await workerPool.initialize();
    const mathResult = await workerPool.submitTask('calculateBasicMath', { a: 5, b: 3 });
    console.log(`✓ Worker Pool Math: ${mathResult}`);
    await workerPool.shutdown();
    
    // Test 4: Single Pool Parse (if method exists)
    console.log('\n4. Testing Single Pool Parse...');
    // We'll determine the correct method name from step 2 output
    
    console.log('\n=== VERIFICATION COMPLETE ===');
}

verifyFoundation().catch(console.error);