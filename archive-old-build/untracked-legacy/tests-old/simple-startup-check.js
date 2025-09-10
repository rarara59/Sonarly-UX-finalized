#!/usr/bin/env node

const fs = require('fs');

console.log('🔍 Analyzing Startup Sequence in enhanced-token-discovery-loop.ts');
console.log('=================================================================');

function analyzeStartupFile() {
    const filePath = 'src/scripts/enhanced-token-discovery-loop.ts';
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ Main file not found:', filePath);
        return;
    }
    
    console.log('✅ Reading startup file...\n');
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Look for the main execution flow
    let inMainFunction = false;
    let inAsyncFunction = false;
    let executionLines = [];
    
    console.log('📋 MAIN EXECUTION SEQUENCE:');
    console.log('===========================');
    
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();
        
        // Skip imports and comments
        if (trimmed.startsWith('import') || trimmed.startsWith('//') || trimmed.startsWith('*') || !trimmed) {
            return;
        }
        
        // Look for main function or immediate execution
        if (trimmed.includes('async function main') || 
            trimmed.includes('async function start') ||
            trimmed.includes('async function run') ||
            trimmed.includes('LPEventCache') ||
            trimmed.includes('new ') ||
            trimmed.includes('await ') ||
            trimmed.includes('.start()') ||
            trimmed.includes('.initialize()') ||
            trimmed.includes('console.log') ||
            trimmed.includes('logger.')) {
            
            console.log(`${lineNum}: ${trimmed}`);
            executionLines.push({lineNum, content: trimmed});
        }
    });
    
    console.log('\n🎯 LIKELY HANG POINTS:');
    console.log('======================');
    
    // Look for potential hang points
    executionLines.forEach(({lineNum, content}) => {
        if (content.includes('await') && 
           (content.includes('connect') || 
            content.includes('initialize') || 
            content.includes('start') || 
            content.includes('new '))) {
            console.log(`⚠️  Line ${lineNum}: ${content}`);
            console.log('   ^ This could be a hang point');
        }
    });
    
    console.log('\n💡 NEXT STEPS:');
    console.log('==============');
    console.log('1. Add debug logs after LPEventCache initialization');
    console.log('2. Test each service initialization individually');
    console.log('3. Check environment variables and connections');
}

function checkEnvironment() {
    console.log('\n🔧 ENVIRONMENT CHECK:');
    console.log('=====================');
    
    // Check .env file
    if (fs.existsSync('.env')) {
        console.log('✅ .env file exists');
        const envContent = fs.readFileSync('.env', 'utf8');
        
        // Check for required variables
        const requiredVars = ['MONGO_URI', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
        requiredVars.forEach(varName => {
            if (envContent.includes(varName)) {
                console.log(`✅ ${varName} found`);
            } else {
                console.log(`❌ ${varName} MISSING`);
            }
        });
        
        // Check for RPC URLs
        if (envContent.includes('HELIUS') || envContent.includes('RPC')) {
            console.log('✅ RPC configuration found');
        } else {
            console.log('⚠️  RPC configuration may be missing');
        }
    } else {
        console.log('❌ .env file MISSING');
    }
    
    // Check package.json
    if (fs.existsSync('package.json')) {
        console.log('✅ package.json exists');
    } else {
        console.log('❌ package.json MISSING');
    }
}

// Run analysis
analyzeStartupFile();
checkEnvironment();

console.log('\n🏁 Analysis complete');