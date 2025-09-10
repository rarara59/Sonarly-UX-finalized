# PROMPT: Interface Diagnostic Analysis

## SINGLE FOCUS
Diagnose component interface mismatch between RpcManager and extracted components

## DIAGNOSTIC SCRIPT TO CREATE
**CREATE**: `scripts/diagnose-component-interfaces.js`

## COMPLETE IMPLEMENTATION
```javascript
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('INTERFACE DIAGNOSTIC: Component Method Analysis');
  console.log('=================================================');
  
  try {
    // Define component file paths
    const componentPaths = [
      'src/detection/transport/rpc-manager.js',
      'src/detection/transport/connection-pool-core.js',
      'src/detection/transport/circuit-breaker.js',
      'src/detection/transport/token-bucket.js',
      'src/detection/transport/endpoint-selector.js',
      'src/detection/transport/request-cache.js',
      'src/detection/transport/batch-manager.js',
      'src/detection/transport/hedged-manager.js'
    ];
    
    const interfaceAnalysis = {};
    
    // Analyze each component
    for (const componentPath of componentPaths) {
      const filename = path.basename(componentPath);
      console.log(`\nAnalyzing ${filename}...`);
      
      try {
        const content = await fs.readFile(componentPath, 'utf8');
        const analysis = analyzeComponentInterface(content, filename);
        interfaceAnalysis[filename] = analysis;
        
        console.log(`  Exported methods: ${analysis.exportedMethods.join(', ')}`);
        console.log(`  Public methods: ${analysis.publicMethods.join(', ')}`);
        
        if (analysis.issues.length > 0) {
          console.log(`  ⚠️  Issues found: ${analysis.issues.join(', ')}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error reading ${filename}: ${error.message}`);
        interfaceAnalysis[filename] = { error: error.message };
      }
    }
    
    // Analyze RpcManager component calls
    console.log('\n=== RPC MANAGER COMPONENT CALLS ===');
    const rpcManagerContent = await fs.readFile('src/detection/transport/rpc-manager.js', 'utf8');
    const componentCalls = extractComponentCalls(rpcManagerContent);
    
    componentCalls.forEach(call => {
      console.log(`${call.component}.${call.method}() - Line ${call.line}`);
    });
    
    // Check for interface mismatches
    console.log('\n=== INTERFACE MISMATCH ANALYSIS ===');
    const mismatches = findInterfaceMismatches(interfaceAnalysis, componentCalls);
    
    if (mismatches.length === 0) {
      console.log('✅ No interface mismatches found');
    } else {
      mismatches.forEach(mismatch => {
        console.log(`❌ ${mismatch.component}: calls ${mismatch.expectedMethod} but component has ${mismatch.actualMethods.join(', ')}`);
      });
    }
    
    // Generate fix recommendations
    console.log('\n=== FIX RECOMMENDATIONS ===');
    generateFixRecommendations(mismatches);
    
    // Save detailed results
    const results = {
      timestamp: new Date().toISOString(),
      components_analyzed: Object.keys(interfaceAnalysis),
      interface_analysis: interfaceAnalysis,
      component_calls: componentCalls,
      mismatches: mismatches,
      recommendations: generateDetailedRecommendations(mismatches)
    };
    
    await fs.writeFile('results/interface-diagnostic-results.json', JSON.stringify(results, null, 2));
    console.log('\nDetailed results saved to results/interface-diagnostic-results.json');
    
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
    process.exit(1);
  }
}

// Analyze component interface patterns
function analyzeComponentInterface(content, filename) {
  const exportedMethods = [];
  const publicMethods = [];
  const issues = [];
  
  // Find exported methods
  const exportMatches = content.match(/export\s+{\s*([^}]+)\s*}/g);
  if (exportMatches) {
    exportMatches.forEach(match => {
      const exports = match.match(/(\w+)/g).filter(word => word !== 'export');
      exportedMethods.push(...exports);
    });
  }
  
  // Find class methods (async and regular)
  const methodMatches = content.match(/^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*{/gm);
  if (methodMatches) {
    methodMatches.forEach(match => {
      const methodName = match.match(/(\w+)\s*\(/)[1];
      if (!['constructor', 'if', 'for', 'while', 'switch'].includes(methodName)) {
        publicMethods.push(methodName);
      }
    });
  }
  
  // Check for common issues
  if (exportedMethods.length === 0 && !content.includes('export default')) {
    issues.push('NO_EXPORTS_FOUND');
  }
  
  if (publicMethods.length === 0) {
    issues.push('NO_PUBLIC_METHODS_FOUND');
  }
  
  return {
    exportedMethods,
    publicMethods,
    issues,
    hasDefaultExport: content.includes('export default')
  };
}

// Extract component method calls from RpcManager
function extractComponentCalls(content) {
  const calls = [];
  
  // Find this.components.X.method() patterns
  const callPattern = /this\.components\.(\w+)\.(\w+)\(/g;
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const matches = [...line.matchAll(callPattern)];
    matches.forEach(match => {
      calls.push({
        line: index + 1,
        component: match[1],
        method: match[2],
        fullCall: match[0]
      });
    });
  });
  
  return calls;
}

// Find interface mismatches
function findInterfaceMismatches(interfaceAnalysis, componentCalls) {
  const mismatches = [];
  
  componentCalls.forEach(call => {
    const componentFileName = `${call.component.toLowerCase().replace(/([A-Z])/g, '-$1').substring(1)}.js`;
    const componentAnalysis = interfaceAnalysis[componentFileName];
    
    if (!componentAnalysis || componentAnalysis.error) {
      mismatches.push({
        component: call.component,
        expectedMethod: call.method,
        actualMethods: ['COMPONENT_NOT_FOUND'],
        issue: 'MISSING_COMPONENT_FILE'
      });
      return;
    }
    
    const hasMethod = componentAnalysis.publicMethods.includes(call.method) || 
                     componentAnalysis.exportedMethods.includes(call.method);
    
    if (!hasMethod) {
      mismatches.push({
        component: call.component,
        expectedMethod: call.method,
        actualMethods: componentAnalysis.publicMethods,
        issue: 'METHOD_NOT_FOUND'
      });
    }
  });
  
  return mismatches;
}

// Generate fix recommendations
function generateFixRecommendations(mismatches) {
  if (mismatches.length === 0) {
    console.log('✅ All interfaces match - no fixes needed');
    return;
  }
  
  mismatches.forEach(mismatch => {
    console.log(`\n🔧 Fix for ${mismatch.component}.${mismatch.expectedMethod}:`);
    
    if (mismatch.issue === 'MISSING_COMPONENT_FILE') {
      console.log(`   - Component file not found: create ${mismatch.component.toLowerCase()}.js`);
    } else {
      console.log(`   - Available methods: ${mismatch.actualMethods.join(', ')}`);
      
      // Suggest closest method name
      const closestMethod = findClosestMethod(mismatch.expectedMethod, mismatch.actualMethods);
      if (closestMethod) {
        console.log(`   - Suggested fix: Change ${mismatch.expectedMethod} to ${closestMethod}`);
        console.log(`   - Or add alias: ${mismatch.expectedMethod}() { return this.${closestMethod}(...arguments); }`);
      }
    }
  });
}

// Find closest method name using string similarity
function findClosestMethod(target, available) {
  if (available.length === 0) return null;
  
  let closest = available[0];
  let closestScore = 0;
  
  available.forEach(method => {
    const score = calculateSimilarity(target, method);
    if (score > closestScore) {
      closest = method;
      closestScore = score;
    }
  });
  
  return closestScore > 0.3 ? closest : null;
}

// Simple string similarity calculation
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const matches = shorter.split('').filter(char => longer.includes(char)).length;
  return matches / longer.length;
}

// Generate detailed fix recommendations
function generateDetailedRecommendations(mismatches) {
  return mismatches.map(mismatch => {
    return {
      component: mismatch.component,
      issue: mismatch.issue,
      expected_method: mismatch.expectedMethod,
      available_methods: mismatch.actualMethods,
      fix_type: mismatch.issue === 'MISSING_COMPONENT_FILE' ? 'CREATE_COMPONENT' : 'UPDATE_INTERFACE',
      suggested_action: mismatch.issue === 'MISSING_COMPONENT_FILE' 
        ? `Create component file: ${mismatch.component.toLowerCase()}.js`
        : `Update method call or add interface adapter`
    };
  });
}

main().catch(error => {
  console.error('Interface diagnostic failed:', error.message);
  process.exit(1);
});
```

## SUCCESS CRITERIA FOR THIS DIAGNOSTIC
- Identifies all component files and their exported methods
- Maps all RpcManager component calls to actual component interfaces
- Finds exact method name mismatches causing the TypeError
- Provides specific fix recommendations with suggested method names
- Saves detailed results for interface repair planning