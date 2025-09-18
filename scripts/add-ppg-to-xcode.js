#!/usr/bin/env node

/**
 * Script to add PPGFrameProcessor.m to Xcode project
 */

const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, '..', 'ios', 'Sonarly.xcodeproj', 'project.pbxproj');

// Read the project file
let projectContent = fs.readFileSync(projectPath, 'utf8');

// Check if already added
if (projectContent.includes('PPGFrameProcessor')) {
  console.log('✅ PPGFrameProcessor.m is already in the project');
  process.exit(0);
}

console.log('Adding PPGFrameProcessor.m to Xcode project...');

// Generate unique IDs for the file references (24 character hex strings)
function generateUUID() {
  return 'PPGFP' + Math.random().toString(16).substr(2, 19).toUpperCase();
}

const fileRefId = generateUUID();
const buildFileId = generateUUID();

// 1. Add to PBXBuildFile section
const buildFileEntry = `\t\t${buildFileId} /* PPGFrameProcessor.m in Sources */ = {isa = PBXBuildFile; fileRef = ${fileRefId} /* PPGFrameProcessor.m */; };`;

// Find the PBXBuildFile section and add our entry after AppDelegate.mm
const buildFilePattern = /13B07FBC1A68108700A75B9A \/\* AppDelegate\.mm in Sources \*\/ = \{[^}]+\};/;
projectContent = projectContent.replace(buildFilePattern, (match) => {
  return match + '\n' + buildFileEntry;
});

// 2. Add to PBXFileReference section
const fileRefEntry = `\t\t${fileRefId} /* PPGFrameProcessor.m */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = sourcecode.c.objc; name = PPGFrameProcessor.m; path = Sonarly/PPGFrameProcessor.m; sourceTree = "<group>"; };`;

// Find the PBXFileReference section and add our entry after AppDelegate.mm
const fileRefPattern = /13B07FB01A68108700A75B9A \/\* AppDelegate\.mm \*\/ = \{[^}]+\};/;
projectContent = projectContent.replace(fileRefPattern, (match) => {
  return match + '\n' + fileRefEntry;
});

// 3. Add to the main group (where AppDelegate.mm is listed)
const groupPattern = /(13B07FB01A68108700A75B9A \/\* AppDelegate\.mm \*\/,)/;
projectContent = projectContent.replace(groupPattern, (match) => {
  return match + '\n\t\t\t\t' + fileRefId + ' /* PPGFrameProcessor.m */,';
});

// 4. Add to Sources build phase
const sourcesPattern = /(13B07FBC1A68108700A75B9A \/\* AppDelegate\.mm in Sources \*\/,)/;
projectContent = projectContent.replace(sourcesPattern, (match) => {
  return match + '\n\t\t\t\t' + buildFileId + ' /* PPGFrameProcessor.m in Sources */,';
});

// Write the modified content back
fs.writeFileSync(projectPath, projectContent);

console.log('✅ PPGFrameProcessor.m has been added to the Xcode project');
console.log('\nDetails:');
console.log(`  File Reference ID: ${fileRefId}`);
console.log(`  Build File ID: ${buildFileId}`);
console.log('\nNext steps:');
console.log('1. Open ios/Sonarly.xcworkspace in Xcode');
console.log('2. Clean build folder (Cmd+Shift+K)');
console.log('3. Build the project (Cmd+B)');