# REMOVE the circuit breaker creation from Day 1
# INSTEAD: Extend existing MemeCoinCircuitBreaker

claude-code "Extend existing MemeCoinCircuitBreaker in liquidity-pool-creation-detector.service.js:

PURPOSE: Add service-specific circuit breaking to existing memory/timeout protection
EXISTING ASSETS: MemeCoinCircuitBreaker with memory, transaction, timeout limits
NEW FEATURES NEEDED:
- RPC endpoint failure detection
- Service-specific latency monitoring  
- Integration with new SignalBus for alerts

ADD METHODS TO EXISTING CLASS:
- checkServiceHealth(serviceName, latency, success)
- shouldBreakService(serviceName) 
- getServiceStatus(serviceName)
- resetServiceBreaker(serviceName)

SERVICE THRESHOLDS TO ADD:
- rpcConnection: maxLatency 100ms, maxErrors 3
- tokenValidation: maxLatency 50ms, maxErrors 5
- tradingExecution: maxLatency 200ms, maxErrors 2

INTEGRATION POINTS:
- Use existing scanMetrics structure
- Emit alerts via new SignalBus
- Maintain current memory/timeout protection

KEEP EXISTING: All current functionality (memory, timeouts, duplicate detection)
FILE LOCATION: Extend class in existing liquidity-pool-creation-detector.service.js
TARGET: Add ~50 lines to existing ~150-line class"