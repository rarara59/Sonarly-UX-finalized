# FIX: Circuit Breaker SignalBus Crash

## Issue
Circuit breaker missing `canExecute()` method - SignalBus crashes on startup

## Files to Change
- `src/core/circuit-breaker.js`

## Required Changes
1. Add missing `canExecute(service)` method
2. Fix memory leak in `recordSuccess()` 
3. Update parameters for meme coin trading speed

## Commands

```bash
# Add missing canExecute method after isOpen method
sed -i '/isOpen(service) {/,/^  }/a\\n  canExecute(service) {\n    return !this.isOpen(service);\n  }' src/core/circuit-breaker.js

# Fix memory leak - clean both Maps in recordSuccess
sed -i '/recordSuccess(service) {/,/^  }/c\
  recordSuccess(service) {\
    this.failures.delete(service);\
    this.lastFailure.delete(service);\
  }' src/core/circuit-breaker.js

# Update parameters for faster meme coin trading
sed -i 's/this.maxFailures = 3;/this.maxFailures = 5;/' src/core/circuit-breaker.js
sed -i 's/this.cooldownMs = 30000;/this.cooldownMs = 5000;/' src/core/circuit-breaker.js

# Add memory bounds protection
sed -i '/constructor() {/a\    this.maxServices = 1000;' src/core/circuit-breaker.js

# Add bounded growth to recordFailure
sed -i '/recordFailure(service) {/,/^  }/c\
  recordFailure(service) {\
    if (this.failures.size >= this.maxServices) {\
      const oldestService = this.failures.keys().next().value;\
      this.failures.delete(oldestService);\
      this.lastFailure.delete(oldestService);\
    }\
    const current = this.failures.get(service) || 0;\
    this.failures.set(service, current + 1);\
    this.lastFailure.set(service, Date.now());\
  }' src/core/circuit-breaker.js
```

## Test Fix

```bash
# Verify canExecute method exists
node -e "
import('./src/core/circuit-breaker.js').then(({CircuitBreaker}) => {
  const cb = new CircuitBreaker();
  console.log('canExecute exists:', typeof cb.canExecute === 'function');
  console.log('canExecute returns boolean:', typeof cb.canExecute('test') === 'boolean');
});"

# Test SignalBus integration
node -e "
Promise.all([
  import('./src/core/circuit-breaker.js'),
  import('./src/core/signal-bus.js')
]).then(([{CircuitBreaker}, {SignalBus}]) => {
  const cb = new CircuitBreaker();
  const bus = new SignalBus(cb, null);
  bus.emit('testEvent', {test: true});
  console.log('✅ SignalBus integration works');
}).catch(err => console.log('❌ Integration failed:', err.message));"

# Test memory leak fix
node -e "
import('./src/core/circuit-breaker.js').then(({CircuitBreaker}) => {
  const cb = new CircuitBreaker();
  cb.recordFailure('test');
  console.log('Before success - failures:', cb.failures.size, 'lastFailure:', cb.lastFailure.size);
  cb.recordSuccess('test');
  console.log('After success - failures:', cb.failures.size, 'lastFailure:', cb.lastFailure.size);
  console.log('Memory leak fixed:', cb.failures.size === 0 && cb.lastFailure.size === 0);
});"
```

## Validation Checklist
- [ ] `canExecute` method exists and returns boolean
- [ ] SignalBus starts without TypeError crash  
- [ ] `recordSuccess` cleans both failure Maps
- [ ] Parameters updated: maxFailures=5, cooldownMs=5000
- [ ] Memory bounds protection added