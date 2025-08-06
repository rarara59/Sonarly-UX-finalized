# FIX: Eliminate Duplicate Risk Logic

## Issue
TieredTokenFilterService contains 540 lines of duplicated risk analysis logic already implemented in ScamProtectionEngine, LiquidityRiskAnalyzer, and MarketCapRiskFilter modules. This creates maintenance burden and missing critical features like honeypot detection.

## Files to Change
- `src/detection/tiered-token-filter.service.js` (lines 50-70, 550-720)

## Required Changes
1. Add risk module dependency injection to constructor
2. Replace evaluateFreshGem method with orchestrated risk module calls
3. Replace evaluateEstablishedToken method with module integration
4. Delete duplicate checkFreshGemSecurity method
5. Update return formats to match integration expectations

## Commands
```bash
# Add risk module dependencies to constructor after line 50
sed -i '/this.rpcManager = config.rpcManager || null;/a\
        \
        // Risk module dependencies\
        this.scamProtectionEngine = config.scamProtectionEngine;\
        this.liquidityRiskAnalyzer = config.liquidityRiskAnalyzer;\
        this.marketCapRiskFilter = config.marketCapRiskFilter;\
        \
        // Validate required dependencies\
        if (!this.scamProtectionEngine || !this.liquidityRiskAnalyzer || !this.marketCapRiskFilter) {\
            console.warn("⚠️ Risk modules not provided - using internal logic");\
        }' src/detection/tiered-token-filter.service.js

# Replace evaluateFreshGem method with orchestrated approach
sed -i '/async evaluateFreshGem(tokenMetrics) {/,/^    }$/c\
    async evaluateFreshGem(tokenMetrics) {\
        try {\
            // Use existing risk modules if available\
            if (this.scamProtectionEngine && this.liquidityRiskAnalyzer && this.marketCapRiskFilter) {\
                const [scamResult, liquidityResult, marketCapResult] = await Promise.all([\
                    this.scamProtectionEngine.analyzeToken(tokenMetrics.address, tokenMetrics),\
                    this.liquidityRiskAnalyzer.validateExitLiquidity(tokenMetrics.address, tokenMetrics),\
                    this.marketCapRiskFilter.filterByMarketCap(tokenMetrics, "fresh_gem")\
                ]);\
                \
                // Keep unique organic activity analysis\
                const organicCheck = this.checkOrganicActivity(tokenMetrics);\
                \
                // Combine results\
                const passed = !scamResult.isScam && liquidityResult.hasExitLiquidity && marketCapResult.passed && organicCheck.passed;\
                const overallScore = passed ? (scamResult.confidence + (liquidityResult.slippage || 0) + organicCheck.score) / 3 : 0;\
                \
                return {\
                    passed,\
                    score: overallScore / 100, // Normalize to 0-1\
                    securityScore: (100 - scamResult.confidence) / 100,\
                    organicScore: organicCheck.score,\
                    reason: passed ? "fresh_gem_approved" : "fresh_gem_rejected",\
                    failureType: !passed ? "integrated_analysis" : null,\
                    riskAnalysis: { scamResult, liquidityResult, marketCapResult }\
                };\
            }\
            \
            // Fallback to internal logic if modules not available\
            return this.evaluateFreshGemFallback(tokenMetrics);\
        } catch (error) {\
            console.error("Risk module integration failed:", error);\
            return this.evaluateFreshGemFallback(tokenMetrics);\
        }\
    }' src/detection/tiered-token-filter.service.js

# Rename old evaluateFreshGem logic to fallback method
sed -i '/checkFreshGemSecurity(tokenMetrics) {/i\
    async evaluateFreshGemFallback(tokenMetrics) {\
        const isPumpFun = tokenMetrics.isPumpFun;\
        let adjustedMetrics = tokenMetrics;\
        \
        if (isPumpFun) {\
            adjustedMetrics = {\
                ...tokenMetrics,\
                buyToSellRatio: tokenMetrics.buyToSellRatio * 1.5,\
                uniqueWallets: Math.max(tokenMetrics.uniqueWallets, 15)\
            };\
            console.log("🎯 Pump.fun token detected - applying adjusted criteria");\
        }\
        \
        const securityCheck = this.checkFreshGemSecurity(adjustedMetrics);\
        const organicCheck = this.checkOrganicActivity(adjustedMetrics);\
        \
        const securityScore = securityCheck.score;\
        const organicScore = organicCheck.score;\
        const overallScore = (securityScore + organicScore) / 2;\
        \
        const passed = securityCheck.passed && organicCheck.passed;\
        \
        return {\
            passed,\
            score: overallScore || 0,\
            securityScore: securityScore || 0,\
            organicScore: organicScore || 0,\
            reason: passed ? "fresh_gem_approved" : "fresh_gem_rejected",\
            failureType: !securityCheck.passed ? "security" : (!organicCheck.passed ? "organic" : null)\
        };\
    }\
    ' src/detection/tiered-token-filter.service.js

# Replace evaluateEstablishedToken with module integration
sed -i '/async evaluateEstablishedToken(tokenMetrics) {/,/^    }$/c\
    async evaluateEstablishedToken(tokenMetrics) {\
        try {\
            // Use existing risk modules if available\
            if (this.scamProtectionEngine && this.marketCapRiskFilter) {\
                const [scamResult, marketCapResult] = await Promise.all([\
                    this.scamProtectionEngine.analyzeToken(tokenMetrics.address, tokenMetrics),\
                    this.marketCapRiskFilter.filterByMarketCap(tokenMetrics, "established")\
                ]);\
                \
                const passed = !scamResult.isScam && marketCapResult.passed;\
                const score = passed ? (100 - scamResult.confidence) / 100 : 0;\
                \
                return {\
                    passed,\
                    score,\
                    securityScore: score,\
                    organicScore: score,\
                    tier: passed ? "established" : "rejected",\
                    reason: passed ? "established_token_approved" : marketCapResult.reason || scamResult.reasons.join(", ")\
                };\
            }\
            \
            // Fallback to internal logic\
            return this.evaluateEstablishedTokenFallback(tokenMetrics);\
        } catch (error) {\
            console.error("Established token analysis failed:", error);\
            return { passed: false, score: 0, tier: "rejected", reason: error.message };\
        }\
    }' src/detection/tiered-token-filter.service.js

# Add fallback method for established tokens after evaluateEstablishedToken
sed -i '/async evaluateEstablishedToken(tokenMetrics) {/a\
    \
    async evaluateEstablishedTokenFallback(tokenMetrics) {\
        const criteria = {\
            minLiquidityUSD: 10000,\
            minUniqueWallets: 50,\
            maxTopHolderPercent: 30,\
            minVolumeLiquidity: 0.1,\
            minTokenAge: 60\
        };\
        \
        let score = 0;\
        let passed = true;\
        let failureReasons = [];\
        \
        if (tokenMetrics.ageMinutes < criteria.minTokenAge) {\
            passed = false;\
            failureReasons.push("too_young_for_established");\
        } else { score += 0.2; }\
        \
        if (tokenMetrics.lpValueUSD < criteria.minLiquidityUSD) {\
            passed = false;\
            failureReasons.push("insufficient_liquidity");\
        } else { score += 0.2; }\
        \
        return {\
            passed,\
            score: score || 0,\
            tier: passed ? "established" : "rejected",\
            reason: failureReasons.length > 0 ? failureReasons.join(", ") : "established_token_approved"\
        };\
    }' src/detection/tiered-token-filter.service.js
```

## Test Fix
```bash
# Test risk module dependency injection
grep -A 5 "this.scamProtectionEngine" src/detection/tiered-token-filter.service.js

# Test evaluateFreshGem integration
grep -A 10 "scamProtectionEngine.analyzeToken" src/detection/tiered-token-filter.service.js

# Test fallback methods exist
grep -n "evaluateFreshGemFallback\|evaluateEstablishedTokenFallback" src/detection/tiered-token-filter.service.js
```

## Validation Checklist
- [ ] Constructor accepts scamProtectionEngine, liquidityRiskAnalyzer, marketCapRiskFilter dependencies
- [ ] evaluateFreshGem calls existing risk modules in parallel with Promise.all
- [ ] evaluateEstablishedToken integrates with scamProtectionEngine and marketCapRiskFilter
- [ ] Fallback methods preserve original logic when modules unavailable
- [ ] Integration gracefully handles errors and falls back to internal logic