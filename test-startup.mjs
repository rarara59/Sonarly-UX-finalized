console.log('Test: Loading modules...');

console.log('Test: Importing system-config...');
try {
  const { createSystemConfiguration } = await import('./src/config/system-config.js');
  console.log('Test: system-config imported successfully');
} catch (error) {
  console.error('Test: system-config import failed:', error);
}

console.log('Test: Done');