# TASK: Run focused test to confirm current pipeline status
# Specifically check Pump.fun vs Raydium/Orca processing

node src/index.js 2>&1 | tee pipeline_status_check.log

# After 90 seconds, analyze both pipelines:

echo "=== PUMP.FUN PIPELINE STATUS ==="
echo "Pump.fun candidates created:"
grep "🟡 PUMP.FUN PIPELINE DEBUG.*candidate_created" pipeline_status_check.log | wc -l

echo "Pump.fun validations attempted:"
grep "🟡 PUMP.FUN PIPELINE DEBUG.*about_to_validate" pipeline_status_check.log | wc -l

echo "Pump.fun validation successes:"
grep "🟢 PUMP.FUN VALIDATION SUCCESS" pipeline_status_check.log | wc -l

echo "=== RAYDIUM/ORCA PIPELINE STATUS ==="
echo "Other LP candidates created:"
grep "🔵 OTHER LP PIPELINE DEBUG" pipeline_status_check.log | wc -l

echo "Other LP validation attempts:"
grep "🔵 OTHER LP PIPELINE DEBUG.*about_to_validate" pipeline_status_check.log | wc -l

echo "Other LP validation failures:"
grep "💥 FINAL FAILURE.*All.*retries failed" pipeline_status_check.log | wc -l

echo "=== VALIDATION ERROR ANALYSIS ==="
echo "Total 'Invalid param: not a Token mint' errors:"
grep "Invalid param: not a Token mint" pipeline_status_check.log | wc -l

echo "Breakdown by LP type:"
grep -B5 "Invalid param: not a Token mint" pipeline_status_check.log | grep -E "(PUMP\.FUN|OTHER LP)" | sort | uniq -c

echo "=== SUCCESS RATE COMPARISON ==="
echo "Overall successful validations:"
grep "✅ RPC SUCCESS: getTokenSupply returned:" pipeline_status_check.log | wc -l

echo "Sample successful token addresses:"
grep "✅ RPC SUCCESS" pipeline_status_check.log | head -3