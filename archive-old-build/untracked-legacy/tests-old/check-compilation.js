#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Thorp Project - TypeScript Compilation Status Check');
console.log('====================================================');

function checkTSConfig() {
    console.log('\n📋 Checking tsconfig.json...');
    if (fs.existsSync('tsconfig.json')) {
        console.log('   ✅ tsconfig.json exists');
        try {
            const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
            console.log('   ✅ tsconfig.json is valid JSON');
            console.log(`   📁 Output directory: ${tsconfig.compilerOptions?.outDir || 'not specified'}`);
            console.log(`   🗺️  Source maps: ${tsconfig.compilerOptions?.sourceMap || false}`);
        } catch (error) {
            console.log(`   ❌ tsconfig.json parsing error: ${error.message}`);
        }
    } else {
        console.log('   ❌ tsconfig.json not found');
    }
}

function checkPackageJson() {
    console.log('\n📦 Checking package.json scripts...');
    if (fs.existsSync('package.json')) {
        try {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const scripts = pkg.scripts || {};
            
            console.log('   📜 Available scripts:');
            Object.keys(scripts).forEach(script => {
                console.log(`      ${script}: ${scripts[script]}`);
            });
        } catch (error) {
            console.log(`   ❌ package.json parsing error: ${error.message}`);
        }
    } else {
        console.log('   ❌ package.json not found');
    }
}

function runTypeScriptCheck() {
    console.log('\n🔨 Running TypeScript compilation check...');
    
    try {
        // Try tsc --noEmit first for just type checking
        const result = execSync('npx tsc --noEmit', { 
            encoding: 'utf8', 
            stdio: 'pipe',
            timeout: 30000 
        });
        console.log('   ✅ TypeScript compilation successful!');
        console.log('   🎉 No compilation errors found.');
        return true;
    } catch (error) {
        console.log('   ❌ TypeScript compilation failed');
        console.log('\n📋 Compilation errors:');
        console.log('   ' + error.stdout.split('\n').join('\n   '));
        
        // Parse error count
        const errorLines = error.stdout.split('\n');
        const errorSummary = errorLines.find(line => line.includes('error(s)'));
        if (errorSummary) {
            console.log(`\n📊 ${errorSummary.trim()}`);
        }
        
        return false;
    }
}

function checkNodeModules() {
    console.log('\n📚 Checking node_modules...');
    if (fs.existsSync('node_modules')) {
        console.log('   ✅ node_modules directory exists');
        
        // Check for TypeScript
        if (fs.existsSync('node_modules/typescript')) {
            console.log('   ✅ TypeScript installed');
            try {
                const tsVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
                console.log(`   📌 ${tsVersion}`);
            } catch (error) {
                console.log('   ⚠️  Could not determine TypeScript version');
            }
        } else {
            console.log('   ❌ TypeScript not found in node_modules');
        }
    } else {
        console.log('   ❌ node_modules directory not found');
        console.log('   💡 Run "npm install" to install dependencies');
    }
}

function checkCriticalFiles() {
    console.log('\n🎯 Checking critical files mentioned in handoff document...');
    
    const criticalFiles = [
        'src/scripts/enhanced-token-discovery-loop.ts',
        'src/services/liquidity-pool-data-extractor.service.ts',
        'src/services/real-lp-detector.service.ts',
        'src/services/modular-edge-calculator.service.ts',
        'src/services/lp-event-cache.service.ts',
        'src/services/batch-token-processor.service.ts',
        'src/utils/logger.ts'
    ];
    
    criticalFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            console.log(`   ✅ ${filePath}`);
        } else {
            console.log(`   ❌ ${filePath} - MISSING`);
        }
    });
}

function main() {
    checkTSConfig();
    checkPackageJson();
    checkNodeModules();
    checkCriticalFiles();
    
    const compilationSuccess = runTypeScriptCheck();
    
    console.log('\n🏁 Status Check Complete');
    console.log('========================');
    
    if (compilationSuccess) {
        console.log('🟢 STATUS: TypeScript compilation is working');
        console.log('✅ Ready to proceed with development');
    } else {
        console.log('🔴 STATUS: TypeScript compilation is BROKEN');
        console.log('⚠️  System requires fixes before proceeding');
    }
}

// Run the check
main();