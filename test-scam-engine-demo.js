// Demonstrate the Scam Protection Engine
import { ScamProtectionEngine } from './src/detection/risk/scam-protection-engine.js';

// Mock dependencies
const mockRpcPool = {
  execute: async (fn) => {
    // Simulate different token scenarios
    const mockConnection = {
      getTokenLargestAccounts: async (address) => {
        if (address === 'SCAM_TOKEN') {
          return {
            value: [
              { amount: '900000000' }, // 90% in one wallet
              { amount: '100000000' }  // 10% in another
            ]
          };
        }
        return {
          value: [
            { amount: '100000000' },
            { amount: '100000000' },
            { amount: '100000000' },
            { amount: '100000000' },
            { amount: '100000000' }
          ]
        };
      },
      getParsedAccountInfo: async (address) => {
        if (address === 'SCAM_TOKEN') {
          return {
            value: {
              data: {
                parsed: {
                  info: {
                    mintAuthority: 'ACTIVE_MINT_AUTHORITY',
                    freezeAuthority: 'ACTIVE_FREEZE_AUTHORITY',
                    decimals: 9,
                    supply: '1000000000'
                  }
                }
              }
            }
          };
        }
        return {
          value: {
            data: {
              parsed: {
                info: {
                  mintAuthority: null,
                  freezeAuthority: null,
                  decimals: 9,
                  supply: '1000000000'
                }
              }
            }
          }
        };
      },
      getVersion: async () => ({ 'solana-core': '1.16.0' })
    };
    return fn(mockConnection);
  }
};

const mockSignalBus = {
  emit: (event, data) => {
    console.log(`📡 Event: ${event}`);
    if (event === 'scam_detected') {
      console.log('🚨 SCAM ALERT:', data);
    }
  }
};

const mockLogger = {
  debug: (...args) => console.log('🔍', ...args),
  warn: (...args) => console.log('⚠️', ...args),
  error: (...args) => console.log('❌', ...args)
};

async function demonstrateScamProtection() {
  console.log('🛡️  RENAISSANCE SCAM PROTECTION ENGINE DEMO\n');
  
  const engine = new ScamProtectionEngine(mockRpcPool, mockSignalBus, mockLogger);
  
  console.log('1️⃣ Testing Normal Token (should pass)');
  const normalResult = await engine.analyzeToken('NORMAL_TOKEN');
  console.log('Result:', {
    isScam: normalResult.isScam,
    confidence: normalResult.confidence,
    reasons: normalResult.reasons.length
  });
  console.log('');
  
  console.log('2️⃣ Testing Scam Token (high concentration + mint authority)');
  const scamResult = await engine.analyzeToken('SCAM_TOKEN');
  console.log('Result:', {
    isScam: scamResult.isScam,
    confidence: scamResult.confidence,
    reasons: scamResult.reasons
  });
  console.log('');
  
  console.log('3️⃣ Engine Statistics');
  console.log(engine.getStats());
  console.log('');
  
  console.log('4️⃣ Health Check');
  const health = await engine.healthCheck();
  console.log('Health Status:', health);
  
  console.log('\n✅ Demo complete - Scam Protection Engine is operational!');
}

demonstrateScamProtection().catch(console.error);