# FIX: Rate Limit Handling

## Issue
System fails immediately on 429 rate limit errors instead of implementing backoff and queuing strategies.

## Files to Change
- `src/services/tiered-token-filter.service.js` (validateTokenWithRetry method)

## Required Changes
1. Detect 429 rate limit errors specifically
2. Implement exponential backoff for rate limit retries (2s → 5s → 12s → 30s)
3. Add rate limit tracking and statistics
4. Separate rate limit retries from general RPC retries

## Commands
```bash
# Add rate limit detection in error handling
sed -i '/} catch (error) {$/a\                    // Handle rate limiting specifically' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                    if (error.status === 429 || error.code === \"RATE_LIMITED\") {' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                        const rateLimitDelay = Math.min(2000 * Math.pow(2, i), 30000);' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                        console.log(`⏳ Rate limited, waiting ${rateLimitDelay}ms before retry ${i + 1}/${maxRetries}`);' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                        this.stats.rateLimitHits = (this.stats.rateLimitHits || 0) + 1;' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                        continue; // Skip normal retry delay for rate limits' src/services/tiered-token-filter.service.js
sed -i '/} catch (error) {$/a\                    }' src/services/tiered-token-filter.service.js

# Add rate limit tracking to stats
sed -i '/this.stats = {$/a\            rateLimitHits: 0,' src/services/tiered-token-filter.service.js

# Update healthCheck to include rate limit stats
sed -i '/totalPassRate: totalPassRate.toFixed(2) + '\''%'\''$/a\                rateLimitHits: this.stats.rateLimitHits || 0,' src/services/tiered-token-filter.service.js
```

## Test Fix
```bash
# Test rate limit backoff calculation
node -e "for(let i=0; i<5; i++) { const delay = Math.min(2000 * Math.pow(2, i), 30000); console.log(\`Retry \${i+1}: \${delay}ms\`) }"

# Verify rate limit stats initialization
grep -A 10 "this.stats = {" src/services/tiered-token-filter.service.js | grep rateLimitHits
```

## Validation Checklist
- ☐ 429 errors trigger exponential backoff (2s → 30s max)
- ☐ Rate limit hits are tracked separately in statistics
- ☐ Rate limit retries skip normal retry delays
- ☐ Health check reports rate limit hit counts