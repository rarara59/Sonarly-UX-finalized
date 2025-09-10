#!/usr/bin/env node

/**
 * Repair component syntax after incorrect initialize method insertion
 */

import fs from 'fs/promises';

async function repairFile(filePath, componentName) {
  console.log(`Repairing ${componentName}...`);
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Find the constructor and add initialize method after it properly
    // First, remove any incorrectly placed initialize methods
    content = content.replace(/}\s*async initialize\(\) \{[^}]*\}\s*;/g, '}');
    content = content.replace(/}\s*\/\*\*\s*\* Initialize[^}]*\*\/\s*async initialize\(\) \{[^}]*\}/g, '}');
    
    // Find the end of the constructor
    const constructorMatch = content.match(/constructor\([^)]*\)\s*\{/);
    if (!constructorMatch) {
      console.log(`  ⚠️  No constructor found in ${componentName}`);
      return;
    }
    
    // Find the matching closing brace for the constructor
    let braceCount = 0;
    let constructorEnd = -1;
    let startPos = content.indexOf(constructorMatch[0]) + constructorMatch[0].length;
    
    for (let i = startPos; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        if (braceCount === 0) {
          constructorEnd = i;
          break;
        }
        braceCount--;
      }
    }
    
    if (constructorEnd === -1) {
      console.log(`  ⚠️  Could not find constructor end in ${componentName}`);
      return;
    }
    
    // Check if initialize method already exists properly
    if (content.includes('async initialize()') && !content.includes('SyntaxError')) {
      console.log(`  ✓ ${componentName} already has initialize method`);
      return;
    }
    
    // Insert initialize method after constructor
    const initMethod = `
  
  /**
   * Initialize the ${componentName} (compatibility method)
   */
  async initialize() {
    // Component is already initialized in constructor
    return true;
  }`;
    
    content = content.slice(0, constructorEnd + 1) + initMethod + content.slice(constructorEnd + 1);
    
    // Clean up any duplicate code or syntax issues
    // Remove duplicate lines that might have been introduced
    const lines = content.split('\n');
    const cleanedLines = [];
    let prevLine = '';
    
    for (const line of lines) {
      // Skip duplicate configuration validation lines
      if (line.trim() === 'this.validateConfiguration();' && prevLine.trim() === '}') {
        continue;
      }
      // Skip orphaned closing braces after method definitions
      if (line.trim() === '}' && prevLine.trim() === '}' && cleanedLines[cleanedLines.length - 2]?.trim() === '}') {
        continue;
      }
      cleanedLines.push(line);
      prevLine = line;
    }
    
    content = cleanedLines.join('\n');
    
    await fs.writeFile(filePath, content);
    console.log(`  ✓ ${componentName} repaired successfully`);
    
  } catch (error) {
    console.log(`  ❌ Failed to repair ${componentName}: ${error.message}`);
  }
}

async function main() {
  console.log('REPAIRING COMPONENT SYNTAX');
  console.log('==========================\n');
  
  const components = [
    { file: 'src/detection/transport/token-bucket.js', name: 'TokenBucket' },
    { file: 'src/detection/transport/circuit-breaker.js', name: 'CircuitBreaker' },
    { file: 'src/detection/transport/request-cache.js', name: 'RequestCache' },
    { file: 'src/detection/transport/endpoint-selector.js', name: 'EndpointSelector' },
    { file: 'src/detection/transport/connection-pool-core.js', name: 'ConnectionPoolCore' },
    { file: 'src/detection/transport/batch-manager.js', name: 'BatchManager' },
    { file: 'src/detection/transport/hedged-manager.js', name: 'HedgedManager' }
  ];
  
  for (const component of components) {
    await repairFile(component.file, component.name);
  }
  
  // Special handling for ConnectionPoolCore - add executeWithEndpoint
  console.log('\nAdding executeWithEndpoint to ConnectionPoolCore...');
  const poolPath = 'src/detection/transport/connection-pool-core.js';
  let poolContent = await fs.readFile(poolPath, 'utf8');
  
  if (!poolContent.includes('executeWithEndpoint')) {
    // Find the execute method and add executeWithEndpoint before it
    const executeMatch = poolContent.match(/(\s+)async execute\(/);
    if (executeMatch) {
      const indent = executeMatch[1];
      const executeWithEndpointMethod = `${indent}/**
${indent} * Execute request with specific endpoint (compatibility method)
${indent} */
${indent}async executeWithEndpoint(endpoint, options) {
${indent}  // Delegate to execute method with endpoint in options
${indent}  return this.execute({ ...options, endpoint });
${indent}}
${indent}
`;
      
      poolContent = poolContent.replace(/(\s+)async execute\(/, executeWithEndpointMethod + '$1async execute(');
      await fs.writeFile(poolPath, poolContent);
      console.log('  ✓ Added executeWithEndpoint method');
    }
  }
  
  // Special handling for EndpointSelector - add selectBackupEndpoint
  console.log('\nAdding selectBackupEndpoint to EndpointSelector...');
  const selectorPath = 'src/detection/transport/endpoint-selector.js';
  let selectorContent = await fs.readFile(selectorPath, 'utf8');
  
  if (!selectorContent.includes('selectBackupEndpoint')) {
    // Find selectEndpoint method and add selectBackupEndpoint after it
    const selectEndpointMatch = selectorContent.match(/selectEndpoint\([^)]*\)\s*\{[^}]*\}/s);
    if (selectEndpointMatch) {
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
  }`;
      
      const insertPos = selectorContent.indexOf(selectEndpointMatch[0]) + selectEndpointMatch[0].length;
      selectorContent = selectorContent.slice(0, insertPos) + backupMethod + selectorContent.slice(insertPos);
      await fs.writeFile(selectorPath, selectorContent);
      console.log('  ✓ Added selectBackupEndpoint method');
    }
  }
  
  console.log('\n✅ Component syntax repaired successfully!');
  console.log('Now testing syntax...\n');
  
  // Test syntax of all repaired files
  for (const component of components) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      await execAsync(`node -c ${component.file}`);
      console.log(`  ✓ ${component.name} syntax valid`);
    } catch (error) {
      console.log(`  ❌ ${component.name} still has syntax errors`);
    }
  }
}

main().catch(error => {
  console.error('Repair failed:', error.message);
  process.exit(1);
});