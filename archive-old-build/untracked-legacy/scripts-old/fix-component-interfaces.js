#!/usr/bin/env node

/**
 * Fix Component Interfaces
 * Adds missing methods to components to match RpcManager expectations
 */

import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('FIXING COMPONENT INTERFACES');
  console.log('============================\n');
  
  try {
    // Fix ConnectionPoolCore - add initialize and executeWithEndpoint methods
    console.log('1. Fixing ConnectionPoolCore...');
    await fixConnectionPoolCore();
    
    // Fix CircuitBreaker - add initialize method
    console.log('2. Fixing CircuitBreaker...');
    await fixCircuitBreaker();
    
    // Fix TokenBucket - add initialize method  
    console.log('3. Fixing TokenBucket...');
    await fixTokenBucket();
    
    // Fix EndpointSelector - add initialize and selectBackupEndpoint methods
    console.log('4. Fixing EndpointSelector...');
    await fixEndpointSelector();
    
    // Fix RequestCache - add initialize method
    console.log('5. Fixing RequestCache...');
    await fixRequestCache();
    
    // Fix BatchManager - add initialize method
    console.log('6. Fixing BatchManager...');
    await fixBatchManager();
    
    // Fix HedgedManager - add initialize method
    console.log('7. Fixing HedgedManager...');
    await fixHedgedManager();
    
    console.log('\n✅ All component interfaces fixed!');
    console.log('Now you can run: node scripts/test-realtime-detection-speed.js');
    
  } catch (error) {
    console.error('Failed to fix interfaces:', error.message);
    process.exit(1);
  }
}

async function fixConnectionPoolCore() {
  const filePath = 'src/detection/transport/connection-pool-core.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  // Add initialize method if missing
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the connection pool (compatibility method)
   */
  async initialize() {
    // Connection pool is already initialized in constructor
    // This method exists for interface compatibility
    return true;
  }
`;
    
    // Insert after constructor
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
  
  // Add executeWithEndpoint method if missing
  if (!content.includes('executeWithEndpoint')) {
    const executeMethod = `
  /**
   * Execute request with specific endpoint (compatibility method)
   */
  async executeWithEndpoint(endpoint, options) {
    // Delegate to execute method with endpoint in options
    return this.execute({ ...options, endpoint });
  }
`;
    
    // Insert before execute method
    const updatedContent = await fs.readFile(filePath, 'utf8');
    const finalContent = updatedContent.replace(
      /async execute\(/,
      executeMethod + '\n  async execute('
    );
    
    await fs.writeFile(filePath, finalContent);
    console.log('  ✓ Added executeWithEndpoint() method');
  }
}

async function fixCircuitBreaker() {
  const filePath = 'src/detection/transport/circuit-breaker.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the circuit breaker (compatibility method)
   */
  async initialize() {
    // Circuit breaker is already initialized in constructor
    return true;
  }
`;
    
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
}

async function fixTokenBucket() {
  const filePath = 'src/detection/transport/token-bucket.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the token bucket (compatibility method)
   */
  async initialize() {
    // Token bucket is already initialized in constructor
    return true;
  }
`;
    
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
}

async function fixEndpointSelector() {
  const filePath = 'src/detection/transport/endpoint-selector.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  // Add initialize method
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the endpoint selector (compatibility method)
   */
  async initialize() {
    // Already initialized via initializeEndpoints in constructor
    return true;
  }
`;
    
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
  
  // Add selectBackupEndpoint method
  const currentContent = await fs.readFile(filePath, 'utf8');
  if (!currentContent.includes('selectBackupEndpoint')) {
    const backupMethod = `
  /**
   * Select a backup endpoint (compatibility method)
   */
  selectBackupEndpoint(excludeEndpoint) {
    // Get available endpoints excluding the primary
    const available = this.getAvailableEndpoints().filter(
      ep => ep.url !== excludeEndpoint
    );
    
    if (available.length === 0) {
      return null;
    }
    
    // Use round-robin selection for backup
    return this.selectRoundRobin(available);
  }
`;
    
    // Insert after selectEndpoint method
    const finalContent = currentContent.replace(
      /selectEndpoint\([^)]*\)\s*{[^}]+}/,
      (match) => match + backupMethod
    );
    
    await fs.writeFile(filePath, finalContent);
    console.log('  ✓ Added selectBackupEndpoint() method');
  }
}

async function fixRequestCache() {
  const filePath = 'src/detection/transport/request-cache.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the request cache (compatibility method)
   */
  async initialize() {
    // Cache is already initialized in constructor
    return true;
  }
`;
    
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
}

async function fixBatchManager() {
  const filePath = 'src/detection/transport/batch-manager.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the batch manager (compatibility method)
   */
  async initialize() {
    // Batch manager is already initialized in constructor
    return true;
  }
`;
    
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
}

async function fixHedgedManager() {
  const filePath = 'src/detection/transport/hedged-manager.js';
  const content = await fs.readFile(filePath, 'utf8');
  
  if (!content.includes('initialize()')) {
    const initMethod = `
  /**
   * Initialize the hedged manager (compatibility method)
   */
  async initialize() {
    // Hedged manager is already initialized in constructor
    return true;
  }
`;
    
    const updatedContent = content.replace(
      /constructor\([^)]*\)\s*{[^}]+}/,
      (match) => match + initMethod
    );
    
    await fs.writeFile(filePath, updatedContent);
    console.log('  ✓ Added initialize() method');
  }
}

main().catch(error => {
  console.error('Fix script failed:', error.message);
  process.exit(1);
});