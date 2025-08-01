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

// Ensure proper class closing before APIClient
const lastMethodEnd = content.lastIndexOf('  }');
const apiClientStart = content.indexOf('class APIClient {');

if (apiClientStart !== -1 && lastMethodEnd !== -1 && lastMethodEnd > apiClientStart) {
  // Need to close RPCConnectionManager class before APIClient
  const insertPoint = content.lastIndexOf('  }', apiClientStart);
  if (insertPoint !== -1) {
    content = content.substring(0, insertPoint + 3) + '\n}\n\n// ===========================\n// COMPLETE API CLIENT\n// ===========================\n\n' + content.substring(apiClientStart);
  }
}

fs.writeFileSync('src/services/rpc-connection-manager-fixed.js', content);
console.log('✅ File cleaned and properly structured');
