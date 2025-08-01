console.log('Test2: Loading modules...');

console.log('Test2: Importing thorp-system...');
try {
  const { createThorpSystem } = await import('./src/services/thorp-system.service.js');
  console.log('Test2: thorp-system imported successfully');
} catch (error) {
  console.error('Test2: thorp-system import failed:', error);
}

console.log('Test2: Done');