# TASK: Execute 2-minute end-to-end success test
# This should finally show the complete pipeline working

node src/index.js 2>&1 | tee complete_pipeline_test.log

# After 2 minutes, analyze COMPLETE pipeline success:

# 1. PUMP.FUN SCORING SUCCESS
echo "=== PUMP.FUN SCORING ANALYSIS ==="
grep "🚀 PUMP.FUN BOOST" complete_pipeline_test.log | head -5
grep "✅ THRESHOLD CHECK.*Pump.fun" complete_pipeline_test.log | head -5
# Expected: Shows Pump.fun instructions scoring 10+ and passing threshold

# 2. PUMP.FUN CANDIDATE CREATION
echo "=== PUMP.FUN CANDIDATE CREATION ==="
grep "🟡 PUMP.FUN PIPELINE DEBUG.*candidate_created" complete_pipeline_test.log | wc -l
# Expected: > 0 (Pump.fun candidates finally created!)

# 3. PUMP.FUN TOKEN VALIDATION ATTEMPTS
echo "=== PUMP.FUN VALIDATION ATTEMPTS ==="
grep "🟡 PUMP.FUN PIPELINE DEBUG.*about_to_validate" complete_pipeline_test.log | wc -l
# Expected: > 0 (Pump.fun tokens reaching validation!)

# 4. SUCCESSFUL TOKEN VALIDATIONS
echo "=== VALIDATION SUCCESS ==="
grep "✅ RPC SUCCESS: getTokenSupply returned:" complete_pipeline_test.log | wc -l
# Expected: > 0 (first successful validations!)

# 5. TRADING SIGNALS GENERATED
echo "=== TRADING SIGNALS ==="
grep "🎯 TRADING MODE: High-confidence candidate with validated token" complete_pipeline_test.log | wc -l
# Expected: > 0 (actual trading signals for meme-coins!)

# 6. END-TO-END SUCCESS RATE
echo "=== SUCCESS METRICS ==="
echo "Pump.fun candidates created:"
grep "🟡 PUMP.FUN PIPELINE DEBUG.*candidate_created" complete_pipeline_test.log | wc -l
echo "Pump.fun tokens validated successfully:"
grep "🟢 PUMP.FUN VALIDATION SUCCESS" complete_pipeline_test.log | wc -l
echo "Trading signals generated:"
grep "🎯 TRADING MODE.*validated token" complete_pipeline_test.log | wc -l

# 7. SAMPLE SUCCESSFUL TOKENS
echo "=== SUCCESSFUL TOKENS ==="
grep "✅ RPC SUCCESS" complete_pipeline_test.log -A1 -B1 | head -10
# Expected: Shows actual token addresses that validated successfully