node -e "
Promise.all([
  Promise.resolve().then(() => {
    process.env.USE_FAKES = 'false';
    return import('./tests/helpers/test-factory.js').then(m => m.createTestableComponent('rpc-pool', false));
  }),
  Promise.resolve().then(() => {
    process.env.USE_FAKES = 'true';
    return import('./tests/helpers/test-factory.js').then(m => m.createTestableComponent('rpc-pool', true));
  })
]).then(([real, fake]) => {
  console.log('Real implementation:', real.implementation.constructor.name);
  console.log('Fake implementation:', fake.implementation.constructor.name);
  
  return Promise.all([
    real.call('getBalance', ['test-address']),
    fake.call('getBalance', ['test-address'])
  ]);
}).then(([realResult, fakeResult]) => {
  console.log('Real result structure:', Object.keys(realResult));
  console.log('Fake result structure:', Object.keys(fakeResult));
  
  const structureMatch = JSON.stringify(Object.keys(realResult).sort()) === JSON.stringify(Object.keys(fakeResult).sort());
  console.log('Structure match:', structureMatch);
  
  if (structureMatch) {
    console.log('✅ RPC Pool contract-first validation passed');
  } else {
    console.log('❌ Interface mismatch detected');
  }
}).catch(err => console.error('Integration error:', err.message));
"