const fs = require('fs');

let content = fs.readFileSync('src/services/rpc-connection-manager-fixed.js', 'utf8');

// Find first occurrence of APIClient class
const firstAPIClient = content.indexOf('class APIClient {');
if (firstAPIClient === -1) {
  console.log('No APIClient found - file may be incomplete');
  process.exit(1);
}

// Find second occurrence (duplicate)
const secondAPIClient = content.indexOf('class APIClient {', firstAPIClient + 1);

// If duplicate found, remove everything from the second occurrence onward
if (secondAPIClient !== -1) {
  console.log('Removing duplicate APIClient section...');
  content = content.substring(0, secondAPIClient);
  
  // Add proper closing for the file
  content += `
// Export as singleton for MVP
module.exports = new RPCConnectionManager();`;
}

// Check if we need to close RPCConnectionManager class properly
const lines = content.split('\n');
let braceCount = 0;
let inRPCClass = false;
let rpcClassStart = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  if (line.includes('class RPCConnectionManager')) {
    inRPCClass = true;
    rpcClassStart = i;
    braceCount = 0;
  }
  
  if (inRPCClass) {
    // Count opening braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceCount += openBraces - closeBraces;
    
    // If we're back to 0 braces, the class is closed
    if (braceCount === 0 && i > rpcClassStart && line.includes('}')) {
      console.log(`RPCConnectionManager class closes at line ${i + 1}`);
      inRPCClass = false;
      break;
    }
  }
}

// If still in class (braceCount > 0), we need to add a closing brace
if (inRPCClass && braceCount > 0) {
  console.log('Adding missing closing brace for RPCConnectionManager class');
  const insertIndex = content.lastIndexOf('  }');
  if (insertIndex !== -1) {
    content = content.substring(0, insertIndex + 3) + '\n}';
  }
}

fs.writeFileSync('src/services/rpc-connection-manager-fixed.js', content);
console.log('✅ File cleaned and properly structured');
console.log(`Final file size: ${content.length} characters`);
