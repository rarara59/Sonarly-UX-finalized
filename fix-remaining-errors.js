#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Thorp Project - Fix Remaining TypeScript Errors');
console.log('==================================================');

function analyzeAndFixErrors() {
    console.log('\n📋 Analyzing remaining TypeScript errors...');
    
    // Fix 1: migrate-classification-model.ts import issue
    const migrationFile = 'src/scripts/migrate-classification-model.ts';
    if (fs.existsSync(migrationFile)) {
        console.log(`\n📄 Checking ${migrationFile}...`);
        
        let content = fs.readFileSync(migrationFile, 'utf8');
        let modified = false;
        
        // Fix import issue - remove AuditTrailLogger if it doesn't exist
        if (content.includes('AuditTrailLogger')) {
            console.log('   🔍 Found AuditTrailLogger import issue');
            
            // Check what's actually exported from classificationAuditTrail
            const auditTrailFile = 'src/models/classificationAuditTrail.ts';
            if (fs.existsSync(auditTrailFile)) {
                const auditContent = fs.readFileSync(auditTrailFile, 'utf8');
                if (!auditContent.includes('export.*AuditTrailLogger')) {
                    console.log('   🔧 Removing AuditTrailLogger from import');
                    content = content.replace(
                        /import\s*{\s*([^}]*),\s*AuditTrailLogger\s*}\s*from/,
                        'import { $1 } from'
                    );
                    content = content.replace(
                        /import\s*{\s*AuditTrailLogger\s*,\s*([^}]*)\s*}\s*from/,
                        'import { $1 } from'
                    );
                    content = content.replace(
                        /import\s*{\s*AuditTrailLogger\s*}\s*from[^;]+;?\n?/,
                        ''
                    );
                    modified = true;
                }
            }
        }
        
        // Fix duplicate exports - find all export declarations
        const exportMatches = content.match(/export\s+(const|class|function)\s+ClassificationModelMigration/g);
        if (exportMatches && exportMatches.length > 1) {
            console.log(`   🔍 Found ${exportMatches.length} duplicate exports`);
            console.log('   🔧 Removing duplicate export declarations');
            
            // Keep only the first export, remove others
            let exportCount = 0;
            content = content.replace(/export\s+(const|class|function)\s+ClassificationModelMigration/g, (match) => {
                exportCount++;
                if (exportCount === 1) {
                    return match; // Keep first export
                } else {
                    return match.replace('export ', ''); // Remove export from duplicates
                }
            });
            modified = true;
        }
        
        // Fix error type issues
        const errorRegex = /catch\s*\(\s*error\s*\)\s*{[^}]*error\.message/g;
        if (errorRegex.test(content)) {
            console.log('   🔍 Found untyped error handling');
            console.log('   🔧 Adding error type handling');
            content = content.replace(
                /catch\s*\(\s*error\s*\)\s*{/g,
                'catch (error: any) {'
            );
            modified = true;
        }
        
        // Fix implicit any[] types
        if (content.includes('flagsSummary = []')) {
            console.log('   🔍 Found implicit any[] type');
            console.log('   🔧 Adding explicit type annotation');
            content = content.replace(
                /let\s+flagsSummary\s*=\s*\[\]/g,
                'let flagsSummary: any[] = []'
            );
            content = content.replace(
                /const\s+flagsSummary\s*=\s*\[\]/g,
                'const flagsSummary: any[] = []'
            );
            modified = true;
        }
        
        if (modified) {
            console.log('   ✅ Writing fixes to file');
            fs.writeFileSync(migrationFile, content);
        } else {
            console.log('   ℹ️  No automatic fixes applied');
        }
    }
    
    // Fix 2: review-data.ts property issue
    const reviewFile = 'src/scripts/review-data.ts';
    if (fs.existsSync(reviewFile)) {
        console.log(`\n📄 Checking ${reviewFile}...`);
        
        let content = fs.readFileSync(reviewFile, 'utf8');
        let modified = false;
        
        // Fix classification_timestamp property issue
        if (content.includes('.classification_timestamp')) {
            console.log('   🔍 Found classification_timestamp property issue');
            console.log('   🔧 Adding optional chaining or property check');
            
            // Replace direct property access with safe access
            content = content.replace(
                /\.classification_timestamp/g,
                '?.classification_timestamp || (doc as any).classification_timestamp'
            );
            modified = true;
        }
        
        if (modified) {
            console.log('   ✅ Writing fixes to file');
            fs.writeFileSync(reviewFile, content);
        } else {
            console.log('   ℹ️  No automatic fixes applied');
        }
    }
    
    // Fix 3: thorp-orchestrator.service.ts type issues
    const orchestratorFile = 'src/services/thorp-orchestrator.service.ts';
    if (fs.existsSync(orchestratorFile)) {
        console.log(`\n📄 Checking ${orchestratorFile}...`);
        
        let content = fs.readFileSync(orchestratorFile, 'utf8');
        let modified = false;
        
        // Fix LPEventCache type usage
        if (content.includes('LPEventCache') && !content.includes('typeof LPEventCache')) {
            console.log('   🔍 Found LPEventCache type issue');
            console.log('   🔧 Fixing type references');
            
            // Fix type usage - LPEventCache refers to value, not type
            content = content.replace(
                /:\s*LPEventCache(?!\w)/g,
                ': typeof LPEventCache'
            );
            modified = true;
        }
        
        if (modified) {
            console.log('   ✅ Writing fixes to file');
            fs.writeFileSync(orchestratorFile, content);
        } else {
            console.log('   ℹ️  No automatic fixes applied');
        }
    }
}

function createBackups() {
    console.log('\n💾 Creating backups before fixes...');
    
    const filesToBackup = [
        'src/scripts/migrate-classification-model.ts',
        'src/scripts/review-data.ts',
        'src/services/thorp-orchestrator.service.ts'
    ];
    
    const backupDir = '.error-fix-backups';
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    
    filesToBackup.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const backupPath = path.join(backupDir, path.basename(filePath) + '.backup');
            fs.copyFileSync(filePath, backupPath);
            console.log(`   ✅ Backed up ${filePath} to ${backupPath}`);
        }
    });
}

function main() {
    const shouldFix = process.argv.includes('--fix');
    
    if (shouldFix) {
        createBackups();
        analyzeAndFixErrors();
        
        console.log('\n🔨 Running TypeScript check after fixes...');
        console.log('Run: node check-compilation.js');
    } else {
        console.log('\n🔍 DRY RUN MODE');
        console.log('This script will attempt to fix the remaining TypeScript errors:');
        console.log('   • migrate-classification-model.ts: Import and export issues');
        console.log('   • review-data.ts: Property access issues');  
        console.log('   • thorp-orchestrator.service.ts: Type reference issues');
        console.log('\n💡 To apply fixes, run: node fix-remaining-errors.js --fix');
    }
    
    console.log('\n🏁 Error fix analysis complete');
}

main();