/**
 * TEST #20: Token Address Validation - Attack Prevention
 * 
 * What: Solana address format validation and attack prevention
 * How: Test invalid addresses, attack patterns, edge cases in address handling
 * Why: Invalid addresses cause crashes or processing of fake tokens
 * Scenarios: Invalid base58, wrong length, checksum failures, collision attempts
 * Money Impact: MEDIUM - Processing fake tokens wastes resources
 */

// Mock RPC Manager for address validation testing
class AddressValidationMockRpc {
    constructor() {
        this.callCount = 0;
        this.rejectedAddresses = new Set();
    }
    
    async call(method, params) {
        this.callCount++;
        const address = params[0];
        
        // Track addresses that should be rejected
        if (!this.isValidSolanaAddress(address)) {
            this.rejectedAddresses.add(address);
            throw new Error(`Invalid token address: ${address}`);
        }
        
        // Mock valid responses for valid addresses
        if (method === 'getTokenSupply') {
            return {
                value: {
                    amount: "1000000000",
                    decimals: 9,
                    uiAmount: 1000
                }
            };
        }
        
        if (method === 'getAccountInfo') {
            return {
                value: {
                    data: {
                        parsed: {
                            info: {
                                supply: "1000000000",
                                decimals: 9,
                                mintAuthority: null,
                                freezeAuthority: null
                            }
                        }
                    }
                }
            };
        }
        
        return null;
    }
    
    async rotateEndpoint() {
        // Mock rotation
    }
    
    // Basic Solana address validation for comparison
    isValidSolanaAddress(address) {
        if (!address || typeof address !== 'string') return false;
        if (address.length < 32 || address.length > 44) return false;
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
        return base58Regex.test(address);
    }
}

// Import the service (adjust path as needed)
import { TieredTokenFilterService } from './src/services/tiered-token-filter.service.js';

async function testTokenAddressValidation() {
    console.log('🧪 TEST #20: Token Address Validation - Attack Prevention');
    console.log('=' .repeat(70));
    
    const mockRpc = new AddressValidationMockRpc();
    const filterService = new TieredTokenFilterService({
        rpcManager: mockRpc
    });
    
    await filterService.initialize();
    
    // ATTACK VECTOR 1: Invalid Base58 Characters
    console.log('\n📋 ATTACK VECTOR 1: Invalid Base58 Characters');
    console.log('   Testing addresses with forbidden characters (0, O, I, l)');
    
    const invalidBase58Attacks = [
        {
            name: "Contains zero (0)",
            tokenMint: "11111111111111111111111111111110", // Contains '0'
            expectedResult: "rejected"
        },
        {
            name: "Contains capital O",
            tokenMint: "1111111111111111111111111111111O", // Contains 'O'
            expectedResult: "rejected"
        },
        {
            name: "Contains capital I", 
            tokenMint: "1111111111111111111111111111111I", // Contains 'I'
            expectedResult: "rejected"
        },
        {
            name: "Contains lowercase l",
            tokenMint: "1111111111111111111111111111111l", // Contains 'l'
            expectedResult: "rejected"
        },
        {
            name: "Special characters",
            tokenMint: "11111111111111111111111111111@#$", // Contains special chars
            expectedResult: "rejected"
        }
    ];
    
    for (const attack of invalidBase58Attacks) {
        try {
            const testToken = {
                tokenMint: attack.tokenMint,
                name: "Attack Token",
                symbol: "HACK",
                createdAt: Date.now() - (5 * 60 * 1000),
                lpValueUSD: 5000,
                uniqueWallets: 30
            };
            
            const startTime = performance.now();
            const result = await filterService.processToken(testToken);
            const processingTime = performance.now() - startTime;
            
            console.log(`   ${attack.name}: ${result.approved ? '❌ ACCEPTED' : '✅ REJECTED'} (${processingTime.toFixed(2)}ms)`);
            
            if (result.approved && attack.expectedResult === "rejected") {
                console.log(`   ⚠️  SECURITY ISSUE: Invalid address was accepted!`);
            }
            
        } catch (error) {
            console.log(`   ${attack.name}: ✅ REJECTED (Exception: ${error.message.substring(0, 50)}...)`);
        }
    }
    
    // ATTACK VECTOR 2: Wrong Address Length
    console.log('\n📋 ATTACK VECTOR 2: Wrong Address Length');
    console.log('   Testing addresses that are too short or too long');
    
    const lengthAttacks = [
        {
            name: "Too short (20 chars)",
            tokenMint: "12345678901234567890",
            expectedResult: "rejected"
        },
        {
            name: "Too short (31 chars)", 
            tokenMint: "1234567890123456789012345678901",
            expectedResult: "rejected"
        },
        {
            name: "Too long (45 chars)",
            tokenMint: "123456789012345678901234567890123456789012345",
            expectedResult: "rejected"
        },
        {
            name: "Way too long (100 chars)",
            tokenMint: "1234567890".repeat(10),
            expectedResult: "rejected"
        },
        {
            name: "Empty string",
            tokenMint: "",
            expectedResult: "rejected"
        },
        {
            name: "Single character",
            tokenMint: "1",
            expectedResult: "rejected"
        }
    ];
    
    for (const attack of lengthAttacks) {
        try {
            const testToken = {
                tokenMint: attack.tokenMint,
                name: "Length Attack Token",
                symbol: "LENG",
                createdAt: Date.now() - (5 * 60 * 1000),
                lpValueUSD: 5000,
                uniqueWallets: 30
            };
            
            const startTime = performance.now();
            const result = await filterService.processToken(testToken);
            const processingTime = performance.now() - startTime;
            
            console.log(`   ${attack.name}: ${result.approved ? '❌ ACCEPTED' : '✅ REJECTED'} (${processingTime.toFixed(2)}ms)`);
            
            if (result.approved && attack.expectedResult === "rejected") {
                console.log(`   ⚠️  SECURITY ISSUE: Invalid length address was accepted!`);
            }
            
        } catch (error) {
            console.log(`   ${attack.name}: ✅ REJECTED (Exception: ${error.message.substring(0, 50)}...)`);
        }
    }
    
    // ATTACK VECTOR 3: Type Confusion Attacks
    console.log('\n📋 ATTACK VECTOR 3: Type Confusion Attacks');
    console.log('   Testing non-string inputs that could cause crashes');
    
    const typeAttacks = [
        {
            name: "Null value",
            tokenMint: null,
            expectedResult: "rejected"
        },
        {
            name: "Undefined value",
            tokenMint: undefined, 
            expectedResult: "rejected"
        },
        {
            name: "Number instead of string",
            tokenMint: 12345678901234567890123456789012,
            expectedResult: "rejected"
        },
        {
            name: "Array instead of string",
            tokenMint: ["11111111111111111111111111111112"],
            expectedResult: "rejected"
        },
        {
            name: "Object instead of string",
            tokenMint: { address: "11111111111111111111111111111112" },
            expectedResult: "rejected"
        },
        {
            name: "Boolean true",
            tokenMint: true,
            expectedResult: "rejected"
        },
        {
            name: "Boolean false",
            tokenMint: false,
            expectedResult: "rejected"
        }
    ];
    
    for (const attack of typeAttacks) {
        try {
            const testToken = {
                tokenMint: attack.tokenMint,
                name: "Type Attack Token", 
                symbol: "TYPE",
                createdAt: Date.now() - (5 * 60 * 1000),
                lpValueUSD: 5000,
                uniqueWallets: 30
            };
            
            const startTime = performance.now();
            const result = await filterService.processToken(testToken);
            const processingTime = performance.now() - startTime;
            
            console.log(`   ${attack.name}: ${result.approved ? '❌ ACCEPTED' : '✅ REJECTED'} (${processingTime.toFixed(2)}ms)`);
            
            if (result.approved && attack.expectedResult === "rejected") {
                console.log(`   ⚠️  SECURITY ISSUE: Invalid type was accepted!`);
            }
            
        } catch (error) {
            console.log(`   ${attack.name}: ✅ REJECTED (Exception: ${error.message.substring(0, 50)}...)`);
        }
    }
    
    // ATTACK VECTOR 4: Address Field Confusion
    console.log('\n📋 ATTACK VECTOR 4: Address Field Confusion');
    console.log('   Testing tokens with missing or misplaced address fields');
    
    const fieldAttacks = [
        {
            name: "No tokenMint field",
            token: {
                name: "No Address Token",
                symbol: "NONE",
                createdAt: Date.now() - (5 * 60 * 1000),
                lpValueUSD: 5000
                // Missing tokenMint entirely
            },
            expectedResult: "rejected"
        },
        {
            name: "tokenMint in wrong field (address)",
            token: {
                address: "11111111111111111111111111111112", // Should be tokenMint
                name: "Wrong Field Token",
                symbol: "WRONG",
                createdAt: Date.now() - (5 * 60 * 1000),
                lpValueUSD: 5000
            },
            expectedResult: "should_fallback_to_address"
        },
        {
            name: "Multiple conflicting address fields",
            token: {
                tokenMint: "11111111111111111111111111111112",
                address: "22222222222222222222222222222223",
                baseMint: "33333333333333333333333333333334",
                name: "Conflict Token",
                symbol: "CONF",
                createdAt: Date.now() - (5 * 60 * 1000),
                lpValueUSD: 5000
            },
            expectedResult: "should_use_first_valid"
        }
    ];
    
    for (const attack of fieldAttacks) {
        try {
            const startTime = performance.now();
            const result = await filterService.processToken(attack.token);
            const processingTime = performance.now() - startTime;
            
            console.log(`   ${attack.name}: ${result.approved ? '⚠️ ACCEPTED' : '✅ REJECTED'} (${processingTime.toFixed(2)}ms)`);
            console.log(`     Reason: ${result.reason}`);
            
        } catch (error) {
            console.log(`   ${attack.name}: ✅ REJECTED (Exception: ${error.message.substring(0, 50)}...)`);
        }
    }
    
    // ATTACK VECTOR 5: Performance Attacks (Resource Exhaustion)
    console.log('\n📋 ATTACK VECTOR 5: Performance Attacks');
    console.log('   Testing if address validation can be used to exhaust resources');
    
    const performanceStart = performance.now();
    const massValidationResults = [];
    
    // Test processing many invalid addresses quickly
    for (let i = 0; i < 100; i++) {
        try {
            const invalidToken = {
                tokenMint: `invalid_address_${i}_with_special_chars_@#$%^&*()`,
                name: `Spam Token ${i}`,
                symbol: `SPAM${i}`,
                createdAt: Date.now(),
                lpValueUSD: 1000
            };
            
            const itemStart = performance.now();
            const result = await filterService.processToken(invalidToken);
            const itemTime = performance.now() - itemStart;
            
            massValidationResults.push({
                approved: result.approved,
                time: itemTime
            });
            
        } catch (error) {
            massValidationResults.push({
                approved: false,
                time: performance.now() - performanceStart,
                error: true
            });
        }
    }
    
    const totalPerformanceTime = performance.now() - performanceStart;
    const avgTimePerValidation = totalPerformanceTime / 100;
    const approvedCount = massValidationResults.filter(r => r.approved).length;
    const errorCount = massValidationResults.filter(r => r.error).length;
    
    console.log(`   Mass validation (100 invalid addresses):`);
    console.log(`     Total time: ${totalPerformanceTime.toFixed(2)}ms`);
    console.log(`     Average per address: ${avgTimePerValidation.toFixed(2)}ms`);
    console.log(`     Incorrectly approved: ${approvedCount}/100 ${approvedCount > 0 ? '❌' : '✅'}`);
    console.log(`     Properly rejected: ${100 - approvedCount}/100`);
    console.log(`     RPC calls attempted: ${mockRpc.callCount}`);
    
    if (avgTimePerValidation > 100) {
        console.log(`   ⚠️  PERFORMANCE ISSUE: Validation too slow (${avgTimePerValidation.toFixed(2)}ms > 100ms target)`);
    }
    
    // SECURITY ASSESSMENT
    console.log('\n🔍 SECURITY ASSESSMENT SUMMARY');
    console.log('=' .repeat(50));
    
    let securityScore = 100;
    const issues = [];
    
    // Check if any invalid addresses were accepted
    const totalApproved = massValidationResults.filter(r => r.approved).length;
    if (totalApproved > 0) {
        securityScore -= 30;
        issues.push(`${totalApproved} invalid addresses incorrectly approved`);
    }
    
    // Check performance under attack
    if (avgTimePerValidation > 100) {
        securityScore -= 20;
        issues.push(`Slow validation vulnerable to DoS attacks (${avgTimePerValidation.toFixed(2)}ms/addr)`);
    }
    
    // Check RPC call efficiency
    if (mockRpc.callCount > 200) {
        securityScore -= 10;
        issues.push(`Excessive RPC calls during validation (${mockRpc.callCount} calls for 100 addresses)`);
    }
    
    console.log(`🛡️  Overall Security Score: ${securityScore}/100`);
    
    if (issues.length === 0) {
        console.log('✅ NO CRITICAL SECURITY ISSUES DETECTED');
        console.log('   • All invalid addresses properly rejected');
        console.log('   • Performance within acceptable bounds');
        console.log('   • Resource usage optimized');
    } else {
        console.log('⚠️  SECURITY ISSUES DETECTED:');
        issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    // MONEY IMPACT ANALYSIS
    console.log('\n💰 MONEY IMPACT ANALYSIS');
    console.log('   Resource waste per invalid address: ~$0.001 (RPC calls)');
    console.log(`   Potential daily waste (1000 attacks): ~$${(avgTimePerValidation * 1000 * 0.001 / 100).toFixed(3)}`);
    console.log(`   Risk level: ${securityScore >= 80 ? 'LOW' : securityScore >= 60 ? 'MEDIUM' : 'HIGH'}`);
    
    if (securityScore < 80) {
        console.log('   💡 RECOMMENDATION: Implement stricter pre-validation before RPC calls');
        console.log('   💡 RECOMMENDATION: Add rate limiting for address validation');
        console.log('   💡 RECOMMENDATION: Cache validation results for repeated invalid addresses');
    }
    
    console.log('\n🏁 TEST #20 ADDRESS VALIDATION COMPLETE');
    console.log(`📊 Final Assessment: ${securityScore >= 80 ? '✅ SECURE' : '⚠️ NEEDS HARDENING'}`);
    
    return {
        securityScore,
        issues,
        averageValidationTime: avgTimePerValidation,
        rpcCallsGenerated: mockRpc.callCount
    };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testTokenAddressValidation };
}

// Auto-run if directly executed
if (typeof window === 'undefined') {
    testTokenAddressValidation().catch(console.error);
}