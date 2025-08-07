src/services/tiered-token-filter.service.js

Add robust number parsing utility function that handles common formatted number strings like "1,000,000", "50K", "300M", "1B" throughout the mathematical operations in token analysis.

Create: New utility function parseFormattedNumber()
Problem: Numbers like "1,000,000", "50K", "300M" parse as NaN
Use: Replace parseFloat() calls with the new function

Add this utility function:

// Add this utility function to handle formatted numbers
parseFormattedNumber(value) {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;
    
    // Remove commas and spaces
    let cleaned = value.replace(/[,\s]/g, '');
    
    // Handle K, M, B suffixes
    const multipliers = {
        'K': 1000,
        'M': 1000000, 
        'B': 1000000000
    };
    
    const suffix = cleaned.slice(-1).toUpperCase();
    if (multipliers[suffix]) {
        const number = parseFloat(cleaned.slice(0, -1));
        return isNaN(number) ? 0 : number * multipliers[suffix];
    }
    
    // Regular parsing
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

Then replace calls like:

parseFloat(volume24h) → this.parseFormattedNumber(volume24h)
parseFloat(lpValueUSD) → this.parseFormattedNumber(lpValueUSD)