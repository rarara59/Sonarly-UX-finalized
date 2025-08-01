console.log('Test file starting...');

// Test each import individually
console.log('Testing import 1: system-config...');
try {
    const { createSystemConfiguration } = await import('./src/config/system-config.js');
    console.log('✓ system-config imported successfully');
} catch (error) {
    console.error('✗ system-config import failed:', error.message);
}

console.log('\nTesting import 2: thorp-system.service...');
try {
    const { createThorpSystem } = await import('./src/services/thorp-system.service.js');
    console.log('✓ thorp-system.service imported successfully');
} catch (error) {
    console.error('✗ thorp-system.service import failed:', error.message);
}

console.log('\nTesting import 3: memory-optimizer...');
try {
    const { ultraMemoryOptimizer } = await import('./src/utils/memory-optimizer.js');
    console.log('✓ memory-optimizer imported successfully');
} catch (error) {
    console.error('✗ memory-optimizer import failed:', error.message);
}

console.log('\nAll imports tested.');