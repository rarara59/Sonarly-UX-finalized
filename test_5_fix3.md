src/services/tiered-token-filter.service.js

Strengthen Fallback Logic

Update the catch block in evaluateFreshGem to properly trigger fallback logic when risk module integration fails. Ensure the fallback is called in all error scenarios.

REPLACE THIS
} catch (error) {
    console.error("Risk module integration failed:", error);
    return this.evaluateFreshGemFallback(tokenMetrics);
}

WITH THIS
} catch (error) {
    console.error("⚠️ Risk module integration failed, using fallback:", error.message);
    return this.evaluateFreshGemFallback(tokenMetrics);
}

// Also check if any modules returned null and trigger fallback
if (!scamResult || !liquidityResult || !marketCapResult) {
    console.log('⚠️ One or more risk modules failed, using fallback logic');
    return this.evaluateFreshGemFallback(tokenMetrics);
}