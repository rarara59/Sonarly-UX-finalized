async function discoverExports() {
    console.log('=== DISCOVERING SERVICE EXPORTS ===');
    
    try {
        // Discover Circuit Breaker exports
        console.log('\n1. Circuit Breaker Service:');
        const circuitModule = await import('./src/services/circuit-breaker.service.js');
        console.log('Exports:', Object.keys(circuitModule));
        
        // Discover Solana Parser exports  
        console.log('\n2. Solana Pool Parser Service:');
        const parserModule = await import('./src/services/solana-pool-parser.service.js');
        console.log('Exports:', Object.keys(parserModule));
        
        // Discover Worker Pool exports
        console.log('\n3. Worker Pool Manager Service:');
        const workerModule = await import('./src/services/worker-pool-manager.service.js');
        console.log('Exports:', Object.keys(workerModule));
        
        // Show file contents structure (first 10 lines of each)
        console.log('\n=== FILE STRUCTURE PREVIEW ===');
        
        const fs = await import('fs');
        
        console.log('\nCircuit Breaker (first 10 lines):');
        const cbContent = fs.readFileSync('./src/services/circuit-breaker.service.js', 'utf8');
        console.log(cbContent.split('\n').slice(0, 10).join('\n'));
        
        console.log('\nSolana Parser (first 10 lines):');
        const spContent = fs.readFileSync('./src/services/solana-pool-parser.service.js', 'utf8');
        console.log(spContent.split('\n').slice(0, 10).join('\n'));
        
    } catch (error) {
        console.error('Discovery error:', error.message);
    }
}

discoverExports().catch(console.error);