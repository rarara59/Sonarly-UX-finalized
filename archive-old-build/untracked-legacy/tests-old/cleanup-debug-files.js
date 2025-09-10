#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Thorp Project - Debug File Cleanup Script');
console.log('============================================');

// Define patterns to look for
const debugPatterns = [
    { pattern: /^debug-.*\.ts$/, directory: 'src/scripts', description: 'Debug TypeScript files in src/scripts' },
    { pattern: /^debug-.*\.js$/, directory: '.', description: 'Debug JavaScript files in project root' },
    { pattern: /^test-.*\.js$/, directory: '.', description: 'Test JavaScript files in project root' },
    { pattern: /^debug-.*\.ts$/, directory: '.', description: 'Debug TypeScript files in project root' }
];

// Specific files mentioned in the document
const specificFiles = [
    'src/scripts/debug-lp-detection.ts',
    'debug-init.js',
    'test-lp-only.js'
];

function findDebugFiles() {
    const foundFiles = [];

    // Check specific files first
    console.log('\n📋 Checking for specific debug files mentioned in handoff document:');
    specificFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            foundFiles.push(filePath);
            console.log(`   ❌ FOUND: ${filePath}`);
        } else {
            console.log(`   ✅ OK: ${filePath} (not found)`);
        }
    });

    // Check for pattern-based files
    console.log('\n🔍 Scanning for debug files by pattern:');
    debugPatterns.forEach(({ pattern, directory, description }) => {
        if (!fs.existsSync(directory)) {
            console.log(`   ⚠️  Directory not found: ${directory}`);
            return;
        }

        const files = fs.readdirSync(directory);
        const matchingFiles = files.filter(file => pattern.test(file));
        
        if (matchingFiles.length > 0) {
            console.log(`   📁 ${description}:`);
            matchingFiles.forEach(file => {
                const fullPath = path.join(directory, file);
                foundFiles.push(fullPath);
                console.log(`      ❌ FOUND: ${fullPath}`);
            });
        } else {
            console.log(`   ✅ ${description}: No matches found`);
        }
    });

    return foundFiles;
}

function deleteFiles(files, dryRun = true) {
    if (files.length === 0) {
        console.log('\n🎉 No debug files found to clean up!');
        return;
    }

    console.log(`\n${dryRun ? '🔍 DRY RUN - Files that WOULD be deleted:' : '🗑️  DELETING FILES:'}`);
    
    files.forEach(filePath => {
        if (dryRun) {
            console.log(`   📄 ${filePath}`);
        } else {
            try {
                fs.unlinkSync(filePath);
                console.log(`   ✅ Deleted: ${filePath}`);
            } catch (error) {
                console.log(`   ❌ Failed to delete ${filePath}: ${error.message}`);
            }
        }
    });

    if (dryRun) {
        console.log('\n💡 To actually delete these files, run this script with --delete flag:');
        console.log('   node cleanup-debug-files.js --delete');
    }
}

// Main execution
const shouldDelete = process.argv.includes('--delete');
const foundFiles = findDebugFiles();

if (shouldDelete) {
    console.log('\n⚠️  PROCEEDING WITH ACTUAL DELETION...');
    deleteFiles(foundFiles, false);
} else {
    deleteFiles(foundFiles, true);
}

console.log('\n🏁 Debug file cleanup scan complete.');