#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Adding debug logging to enhanced-token-discovery-loop.ts');
console.log('=========================================================');

const filePath = 'src/scripts/enhanced-token-discovery-loop.ts';

if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    process.exit(1);
}

// Read the current file
let content = fs.readFileSync(filePath, 'utf8');

// Check if debug logging is already added
if (content.includes('🔍 DEBUG: About to attempt MongoDB connection')) {
    console.log('⚠️  Debug logging already exists');
    console.log('💡 Run: npm run start:thorp');
    process.exit(0);
}

// Find the mongoose.connect line and add debug logging before it
const debugCode = `
console.log('🔍 DEBUG: About to attempt MongoDB connection...');
console.log('🔍 DEBUG: process.env.MONGODB_URI:', process.env.MONGODB_URI);
console.log('🔍 DEBUG: process.env.MONGO_URI:', process.env.MONGO_URI);
require('dotenv').config();
console.log('🔍 DEBUG: After dotenv.config() - MONGO_URI:', process.env.MONGO_URI);

const connectionString = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/thorp';
console.log('🔍 DEBUG: Final connection string:', connectionString);
console.log('🔍 DEBUG: Starting mongoose.connect with 5s timeout...');

`;

// Find the line with mongoose.connect and add debug before it
const mongooseConnectRegex = /(\s*)(await mongoose\.connect\(.*?\{)/s;
const match = content.match(mongooseConnectRegex);

if (match) {
    const indentation = match[1];
    const replacement = indentation + debugCode.trim().split('\n').join('\n' + indentation) + '\n\n' + indentation + match[2];
    content = content.replace(mongooseConnectRegex, replacement);
    
    // Also add timeout options to the mongoose.connect call
    content = content.replace(
        /await mongoose\.connect\((.*?),\s*\{([^}]*)\}/s,
        'await mongoose.connect($1, {\n    serverSelectionTimeoutMS: 5000,\n    connectTimeoutMS: 5000,\n    socketTimeoutMS: 5000,$2}'
    );
    
    // Add debug after connection
    content = content.replace(
        /(await mongoose\.connect\([^;]+;)/,
        '$1\nconsole.log(\'🔍 DEBUG: MongoDB connection completed successfully!\');'
    );
    
    // Create backup
    fs.writeFileSync(filePath + '.debug-backup', fs.readFileSync(filePath));
    
    // Write the modified file
    fs.writeFileSync(filePath, content);
    
    console.log('✅ Debug logging added successfully');
    console.log('💾 Original file backed up as:', filePath + '.debug-backup');
    console.log('');
    console.log('🚀 Now run: npm run start:thorp');
    console.log('');
    console.log('📊 Expected output:');
    console.log('   1. LPEventCache initialized');
    console.log('   2. DEBUG: About to attempt MongoDB connection...');
    console.log('   3. DEBUG: Final connection string: ...');
    console.log('   4. Either successful connection OR timeout after 5s');
    
} else {
    console.log('❌ Could not find mongoose.connect line to patch');
    console.log('💡 You may need to add debug logging manually');
}