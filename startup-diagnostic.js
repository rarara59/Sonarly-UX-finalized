#!/usr/bin/env node

console.log('🔍 Thorp Startup Sequence Diagnostic');
console.log('====================================');

async function diagnoseStartup() {
    try {
        console.log('\n1️⃣ Testing basic imports...');
        
        // Test logger
        console.log('   📝 Testing logger import...');
        const { logger } = await import('./src/utils/logger.js');
        console.log('   ✅ Logger imported successfully');
        
        // Test LPEventCache
        console.log('   💾 Testing LPEventCache import...');
        const { LPEventCache } = await import('./src/services/lp-event-cache.service.js');
        console.log('   ✅ LPEventCache imported successfully');
        
        // Test database connection
        console.log('\n2️⃣ Testing database connection...');
        console.log('   🗄️ Testing MongoDB connection...');
        const mongoose = await import('mongoose');
        
        // Check if MONGO_URI exists
        const fs = await import('fs');
        if (fs.existsSync('.env')) {
            console.log('   ✅ .env file exists');
            const envContent = fs.readFileSync('.env', 'utf8');
            if (envContent.includes('MONGO_URI')) {
                console.log('   ✅ MONGO_URI found in .env');
            } else {
                console.log('   ❌ MONGO_URI missing from .env');
            }
        } else {
            console.log('   ❌ .env file missing');
        }
        
        // Test RPC connections
        console.log('\n3️⃣ Testing RPC connections...');
        console.log('   🌐 Testing RPC connection manager import...');
        const { RPCConnectionManager } = await import('./src/services/rpc-connection-manager.js');
        console.log('   ✅ RPC Connection Manager imported successfully');
        
        // Test signal modules
        console.log('\n4️⃣ Testing signal modules...');
        console.log('   🧠 Testing modular edge calculator import...');
        const { ModularEdgeCalculatorService } = await import('./src/services/modular-edge-calculator.service.js');
        console.log('   ✅ Modular Edge Calculator imported successfully');
        
        // Test main discovery loop import
        console.log('\n5️⃣ Testing main discovery loop...');
        console.log('   🔍 Testing enhanced-token-discovery-loop import...');
        
        // Let's check what the actual file structure is
        const path = await import('path');
        const currentDir = process.cwd();
        console.log(`   📂 Current directory: ${currentDir}`);
        
        // Check if the main file exists
        if (fs.existsSync('src/scripts/enhanced-token-discovery-loop.ts')) {
            console.log('   ✅ Main discovery loop file exists');
            
            // Let's examine the first 50 lines to see the startup sequence
            const content = fs.readFileSync('src/scripts/enhanced-token-discovery-loop.ts', 'utf8');
            const lines = content.split('\n').slice(0, 50);
            
            console.log('\n📋 Main file startup sequence (first 50 lines):');
            lines.forEach((line, idx) => {
                if (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('import')) {
                    console.log(`   ${idx + 1}: ${line.trim()}`);
                }
            });
        } else {
            console.log('   ❌ Main discovery loop file missing');
        }
        
        console.log('\n✅ Diagnostic complete - all imports successful');
        console.log('💡 If imports work but startup hangs, the issue is likely:');
        console.log('   • Database connection timeout');
        console.log('   • RPC provider timeout');
        console.log('   • Async initialization hanging');
        
    } catch (error) {
        console.log(`\n❌ Diagnostic failed at: ${error.message}`);
        console.log('🔧 This is likely where the startup is hanging');
        console.error(error);
    }
}

diagnoseStartup().then(() => {
    console.log('\n🏁 Startup diagnostic finished');
    process.exit(0);
}).catch(error => {
    console.error('💥 Diagnostic crashed:', error);
    process.exit(1);
});