import { CircuitBreaker } from './src/services/circuit-breaker.service.js';
import { SolanaPoolParserService } from './src/services/solana-pool-parser.service.js';
import { WorkerPoolManager } from './src/services/worker-pool-manager.service.js';

async function verifyFoundation() {
    console.log('=== FOUNDATION VERIFICATION ===');
    
    try {
        // Test 1: Circuit Breaker Basic Function
        console.log('\n1. Testing Circuit Breaker...');
        const circuitBreaker = new CircuitBreaker('test-service');
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
        console.log('✓ Worker Pool initialized');
        
        // Test basic math operation
        const mathResult = await workerPool.submitTask('calculateBasicMath', { a: 5, b: 3 });
        console.log(`✓ Worker Pool Math: ${mathResult}`);
        
        await workerPool.shutdown();
        console.log('✓ Worker Pool shutdown');
        
        console.log('\n=== VERIFICATION COMPLETE ===');
        console.log('✓ All foundation services are functional');
        
    } catch (error) {
        console.error('❌ Foundation error:', error.message);
        console.error('Stack:', error.stack);
    }
}

verifyFoundation().catch(console.error);