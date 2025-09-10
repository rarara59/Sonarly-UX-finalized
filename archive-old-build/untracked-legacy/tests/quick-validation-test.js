// src/tests/quick-validation-test.js
console.log('🧪 Quick Data Pipeline Validation Test\n');

async function runQuickValidationTest() {
  const results = {
    imports: {},
    basicFunctionality: {}
  };

  console.log('📦 Testing Component Imports...');
  
  try {
    // Test imports one by one
    try {
      const DataCache = require('../scripts-js/data-cache');
      results.imports.DataCache = '✅ Imported successfully';
    } catch (e) {
      results.imports.DataCache = `❌ Import failed: ${e.message}`;
    }
    
    try {
      const SignalOrchestrator = require('../scripts-js/signal-orchestrator');
      results.imports.SignalOrchestrator = '✅ Imported successfully';
    } catch (e) {
      results.imports.SignalOrchestrator = `❌ Import failed: ${e.message}`;
    }
    
    try {
      const DataPipeline = require('../scripts-js/data-pipeline');
      results.imports.DataPipeline = '✅ Imported successfully';
    } catch (e) {
      results.imports.DataPipeline = `❌ Import failed: ${e.message}`;
    }

    // Print Results
    console.log('📊 QUICK VALIDATION RESULTS:');
    Object.entries(results.imports).forEach(([component, status]) => {
      console.log(`   ${component}: ${status}`);
    });
    
    const successCount = Object.values(results.imports).filter(s => s.includes('✅')).length;
    console.log(`\n✅ ${successCount}/3 core components imported successfully`);
    
    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

runQuickValidationTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });