verify-rpc-connection-pool.js

“Endpoint Rotation” test never creates overlapping load, so every time selectBestEndpoint() runs all endpoints look identical (0 in-flight, healthy, tokens available). Most selection strategies will deterministically pick the same endpoint in that case (usually index 0). Because you immediately await the 10ms sleep and decrement inFlight before the next selection, your simulated pressure is gone by the time you loop, so rotation never happens → endpointUsage.size stays 1 → the test fails.

Why this happens, line-by-line:
	•	You call const endpoint = this.pool.selectBestEndpoint();
	•	You increment that endpoint’s inFlight, then await new Promise(r => setTimeout(r, 10));, then decrement it.
	•	The await means the loop runs strictly serially. Before the next iteration starts, inFlight is back to 0 on all endpoints.
	•	With no persistent pressure or real calls to update internal stats/latency/ratelimits, the selection sees a tie on every pass and picks the same endpoint.

Use real calls and read per-endpoint stats
This exercises the actual dispatch logic and removes the need for manual inFlight fiddling:

async testEndpointRotation() {
  console.log('🔄 Test 3: Endpoint Rotation');
  console.log('─'.repeat(40));

  try {
    // Make a bunch of real calls
    const N = 30;
    for (let i = 0; i < N; i++) {
      await this.pool.call('getSlot'); // let the pool choose
    }

    // Inspect distribution from real stats
    const stats = this.pool.getStats();
    const used = stats.endpoints.filter(e => e.calls > 0);

    console.log('Endpoint usage (calls):');
    for (const e of stats.endpoints) {
      console.log(`  ${new URL(e.url).hostname}: ${e.calls}`);
    }

    if (used.length < 2) {
      throw new Error('Not enough endpoint rotation');
    }

    console.log(`✅ Used ${used.length} different endpoints`);
    this.tests.endpointRotation = true;
    console.log('\n✅ Endpoint rotation test PASSED\n');
  } catch (error) {
    console.error('❌ Endpoint rotation test FAILED:', error.message);
  }
}