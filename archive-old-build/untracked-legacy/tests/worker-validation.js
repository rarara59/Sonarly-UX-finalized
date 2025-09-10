/**
 * WORKER SCRIPT VALIDATION
 * 
 * Tests if parsing worker can be imported and has basic syntax validity.
 * Identifies import errors, missing dependencies, and syntax issues.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class WorkerValidator {
  constructor() {
    this.workerScript = join(__dirname, '../workers/parsing-worker.js');
    this.constantsScript = join(__dirname, '../constants/layout-constants.js');
  }

  async validateWorkerFiles() {
    console.log('🔍 WORKER SCRIPT VALIDATION');
    console.log('=' * 40);

    try {
      await this.checkFileExists();
      await this.checkConstantsFile();
      await this.checkSolanaImport();
      await this.checkWorkerSyntax();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }

    return true;
  }

  /**
   * Check if worker file exists and is readable
   */
  async checkFileExists() {
    console.log('\n📋 Test 1: File Existence');
    
    try {
      const stats = await fs.promises.stat(this.workerScript);
      console.log(`✅ Worker file exists: ${this.workerScript}`);
      console.log(`   Size: ${stats.size} bytes`);
      console.log(`   Modified: ${stats.mtime.toISOString()}`);
      
      // Check if file is readable
      await fs.promises.access(this.workerScript, fs.constants.R_OK);
      console.log('✅ Worker file is readable');
      
    } catch (error) {
      console.log(`❌ Worker file issue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if layout constants file exists (required import)
   */
  async checkConstantsFile() {
    console.log('\n📋 Test 2: Layout Constants File');
    
    try {
      const stats = await fs.promises.stat(this.constantsScript);
      console.log(`✅ Constants file exists: ${this.constantsScript}`);
      console.log(`   Size: ${stats.size} bytes`);
      
      // Check if constants file has required exports
      const content = await fs.promises.readFile(this.constantsScript, 'utf8');
      const hasRaydium = content.includes('RAYDIUM_LAYOUT_CONSTANTS');
      const hasOrca = content.includes('ORCA_LAYOUT_CONSTANTS');
      const hasMint = content.includes('MINT_LAYOUT_CONSTANTS');
      
      if (hasRaydium && hasOrca && hasMint) {
        console.log('✅ Constants file has required exports');
      } else {
        console.log('❌ Constants file missing required exports');
        console.log(`   RAYDIUM_LAYOUT_CONSTANTS: ${hasRaydium}`);
        console.log(`   ORCA_LAYOUT_CONSTANTS: ${hasOrca}`);
        console.log(`   MINT_LAYOUT_CONSTANTS: ${hasMint}`);
      }
      
    } catch (error) {
      console.log(`❌ Constants file issue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Solana web3.js import works
   */
  async checkSolanaImport() {
    console.log('\n📋 Test 3: Solana Web3.js Import');
    
    try {
      const { PublicKey } = await import('@solana/web3.js');
      console.log('✅ Solana web3.js imported successfully');
      
      // Test PublicKey functionality
      const testKey = new PublicKey('11111111111111111111111111111111');
      console.log(`✅ PublicKey creation works: ${testKey.toString().substring(0, 8)}...`);
      
    } catch (error) {
      console.log(`❌ Solana import failed: ${error.message}`);
      console.log('   This likely means @solana/web3.js is not installed');
      console.log('   Run: npm install @solana/web3.js');
      throw error;
    }
  }

  /**
   * Check worker syntax by attempting to read and parse
   */
  async checkWorkerSyntax() {
    console.log('\n📋 Test 4: Worker Syntax Check');
    
    try {
      const content = await fs.promises.readFile(this.workerScript, 'utf8');
      console.log(`✅ Worker file read successfully (${content.length} characters)`);
      
      // Check for obvious syntax issues
      const issues = [];
      
      // Check for unmatched brackets
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
      }
      
      // Check for unmatched parentheses
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
      }
      
      // Check for required imports
      if (!content.includes('import { parentPort, workerData }')) {
        issues.push('Missing worker_threads import');
      }
      
      if (!content.includes('import { PublicKey }')) {
        issues.push('Missing Solana PublicKey import');
      }
      
      if (!content.includes('RAYDIUM_LAYOUT_CONSTANTS')) {
        issues.push('Missing Raydium constants import');
      }
      
      // Check for message handler
      if (!content.includes('parentPort.on(\'message\'')) {
        issues.push('Missing parentPort message handler');
      }
      
      if (issues.length > 0) {
        console.log('❌ Syntax/structure issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        throw new Error(`Syntax issues: ${issues.join(', ')}`);
      } else {
        console.log('✅ Basic syntax validation passed');
      }
      
    } catch (error) {
      console.log(`❌ Syntax check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test a minimal worker import (not execution)
   */
  async testWorkerImport() {
    console.log('\n📋 Test 5: Worker Import Test');
    
    try {
      // This will fail if there are import or top-level syntax errors
      await import(this.workerScript);
      console.log('❌ Worker imported successfully (this should not happen in worker context)');
      
    } catch (error) {
      // Expected error since worker expects to be in worker_threads context
      if (error.message.includes('parentPort') || 
          error.message.includes('workerData') ||
          error.message.includes('worker_threads')) {
        console.log('✅ Worker import failed as expected (missing worker context)');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`❌ Unexpected import error: ${error.message}`);
        throw error;
      }
    }
  }
}

// Execute validation
const validator = new WorkerValidator();
validator.validateWorkerFiles()
  .then(async (success) => {
    if (success) {
      await validator.testWorkerImport();
      console.log('\n🎉 WORKER VALIDATION COMPLETE');
      console.log('📋 Next steps:');
      console.log('   1. Check package.json for missing dependencies');
      console.log('   2. Verify @solana/web3.js is installed');
      console.log('   3. Test worker in proper worker_threads context');
    }
  })
  .catch(error => {
    console.error('\n❌ VALIDATION FAILED');
    console.error('🔧 Recommended fixes:');
    console.error('   1. Install missing dependencies');
    console.error('   2. Fix syntax errors in worker file');
    console.error('   3. Ensure all import paths are correct');
    process.exit(1);
  });