/**
 * DEPENDENCY CHECK SCRIPT
 * 
 * Verifies all required dependencies for the parsing worker are installed
 * and accessible. This often reveals silent import failures.
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DependencyChecker {
  constructor() {
    this.projectRoot = join(__dirname, '../..');
    this.packageJsonPath = join(this.projectRoot, 'package.json');
  }

  async checkAllDependencies() {
    console.log('🔍 DEPENDENCY CHECK FOR PARSING WORKER');
    console.log('=' * 50);
    console.log(`Project root: ${this.projectRoot}`);

    try {
      await this.checkPackageJson();
      await this.checkSolanaWeb3();
      await this.checkWorkerThreads();
      await this.checkLayoutConstants();
      await this.checkFileStructure();
      
      console.log('\n🎯 DEPENDENCY CHECK COMPLETE');
      
    } catch (error) {
      console.error('❌ Dependency check failed:', error.message);
    }
  }

  async checkPackageJson() {
    console.log('\n📋 Test 1: Package.json Check');
    
    try {
      const packageJson = JSON.parse(await fs.promises.readFile(this.packageJsonPath, 'utf8'));
      console.log('✅ package.json found and readable');
      
      // Check for ES modules
      if (packageJson.type === 'module') {
        console.log('✅ ES modules enabled ("type": "module")');
      } else {
        console.log('⚠️  ES modules not explicitly enabled');
        console.log('   Consider adding "type": "module" to package.json');
      }
      
      // Check dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      console.log('\n📦 Installed packages:');
      
      Object.keys(deps).forEach(dep => {
        console.log(`   ${dep}: ${deps[dep]}`);
      });
      
      // Check for Solana specifically
      if (deps['@solana/web3.js']) {
        console.log(`✅ @solana/web3.js found: ${deps['@solana/web3.js']}`);
      } else {
        console.log('❌ @solana/web3.js NOT FOUND in dependencies');
        console.log('   Run: npm install @solana/web3.js');
      }
      
    } catch (error) {
      console.log(`❌ Package.json error: ${error.message}`);
      throw error;
    }
  }

  async checkSolanaWeb3() {
    console.log('\n📋 Test 2: Solana Web3.js Import Test');
    
    try {
      const { PublicKey, Connection } = await import('@solana/web3.js');
      console.log('✅ @solana/web3.js imports successfully');
      
      // Test PublicKey creation
      const testKey = new PublicKey('11111111111111111111111111111111');
      console.log(`✅ PublicKey creation works: ${testKey.toString().substring(0, 12)}...`);
      
      // Test Connection creation (don't actually connect)
      const connection = new Connection('https://mainnet.helius-rpc.com');
      console.log('✅ Connection object creation works');
      
    } catch (error) {
      console.log(`❌ Solana import failed: ${error.message}`);
      console.log('🔧 SOLUTION: Install Solana web3.js');
      console.log('   Run: npm install @solana/web3.js');
      throw error;
    }
  }

  async checkWorkerThreads() {
    console.log('\n📋 Test 3: Worker Threads Module');
    
    try {
      const { Worker, isMainThread, parentPort, workerData } = await import('worker_threads');
      console.log('✅ worker_threads module imports successfully');
      console.log(`✅ isMainThread: ${isMainThread}`);
      console.log(`✅ parentPort: ${parentPort !== undefined ? 'defined' : 'null (expected in main thread)'}`);
      
    } catch (error) {
      console.log(`❌ Worker threads import failed: ${error.message}`);
      throw error;
    }
  }

  async checkLayoutConstants() {
    console.log('\n📋 Test 4: Layout Constants Import');
    
    const constantsPath = join(__dirname, '../constants/layout-constants.js');
    
    try {
      // Check file exists
      await fs.promises.access(constantsPath);
      console.log('✅ layout-constants.js file exists');
      
      // Try to import
      const constants = await import('../constants/layout-constants.js');
      console.log('✅ layout-constants.js imports successfully');
      
      // Check required exports
      const required = ['RAYDIUM_LAYOUT_CONSTANTS', 'ORCA_LAYOUT_CONSTANTS', 'MINT_LAYOUT_CONSTANTS'];
      const missing = required.filter(name => !constants[name]);
      
      if (missing.length === 0) {
        console.log('✅ All required constants exported');
      } else {
        console.log(`❌ Missing constants: ${missing.join(', ')}`);
      }
      
    } catch (error) {
      console.log(`❌ Layout constants error: ${error.message}`);
      throw error;
    }
  }

  async checkFileStructure() {
    console.log('\n📋 Test 5: File Structure Check');
    
    const requiredFiles = [
      'src/workers/parsing-worker.js',
      'src/constants/layout-constants.js',
      'src/services/worker-pool-manager.service.js',
      'package.json'
    ];
    
    for (const file of requiredFiles) {
      const fullPath = join(this.projectRoot, file);
      
      try {
        const stats = await fs.promises.stat(fullPath);
        console.log(`✅ ${file} exists (${stats.size} bytes)`);
      } catch (error) {
        console.log(`❌ ${file} missing or inaccessible`);
      }
    }
  }

  async suggestFixes() {
    console.log('\n🔧 SUGGESTED FIXES:');
    console.log('1. Install missing dependencies:');
    console.log('   npm install @solana/web3.js');
    console.log('');
    console.log('2. If imports still fail, check Node.js version:');
    console.log('   node --version (should be 16+ for ES modules)');
    console.log('');
    console.log('3. Clear node_modules and reinstall:');
    console.log('   rm -rf node_modules package-lock.json');
    console.log('   npm install');
    console.log('');
    console.log('4. Check package.json has "type": "module"');
  }
}

// Execute dependency check
const checker = new DependencyChecker();
checker.checkAllDependencies()
  .then(() => checker.suggestFixes())
  .catch(error => {
    console.error('\n❌ DEPENDENCY CHECK FAILED');
    console.error('Critical issue found - resolve before proceeding');
    process.exit(1);
  });