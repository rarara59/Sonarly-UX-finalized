rafaltracz@Rafals-MacBook-Air thorpv1 % grep -A 15 "analyzeTransaction" src/detection/detectors/raydium-detector.js
  async analyzeTransaction(transaction) {
    const startTime = performance.now();
    this.metrics.totalTransactions++;
    
    try {
      if (!transaction?.transaction?.message?.instructions) {
        return [];
      }

      const instructions = transaction.transaction.message.instructions || [];
      const accountKeys = transaction.transaction.message.accountKeys || [];
      const candidates = [];

      console.log(`🔍 Analyzing ${instructions.length} instructions for Raydium LP creation`);

      // Process instructions sequentially for accuracy (parallel can miss dependencies)
rafaltracz@Rafals-MacBook-Air thorpv1 % grep -A 5 -B 5 "discriminator\|LP_CREATION\|TOKEN_MINT\|createPool\|initializeMint" src/detection/detectors/raydium-detector.js
    this.performanceMonitor = performanceMonitor;
    
    // Raydium AMM V4 program ID
    this.RAYDIUM_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
    
    // PRODUCTION VERIFIED: Raydium AMM V4 discriminator map
    this.DISCRIMINATOR_MAP = {
      'e7': {
        type: 'initialize2',
        category: 'lp_creation',
        confidence: 0.95,
--
        confidence: 0.75,
        minAccounts: 21,
        description: 'V5 AMM initialization'
      },
      'f8': {
        type: 'createPool',
        category: 'lp_creation',
        confidence: 0.88,
        minAccounts: 16,
        description: 'Direct pool creation'
      }
--
      totalTransactions: 0,
      lpDetections: 0,
      validationSuccesses: 0,
      validationFailures: 0,
      averageLatency: 0,
      discriminatorStats: new Map(),
      slaViolations: 0,
      circuitBreakerTrips: 0
    };

    // Known swap discriminators to filter out
    this.KNOWN_SWAPS = new Set([
      '09', // swap
      'cc', // deposit  
      'e3', // withdraw
      'dd'  // route
--
      
      if (instructionData.length === 0) {
        return null;
      }

      const discriminatorHex = instructionData[0].toString(16).padStart(2, '0');
      
      // Filter out known swaps immediately for performance
      if (this.KNOWN_SWAPS.has(discriminatorHex)) {
        return null;
      }

      const discriminatorInfo = this.DISCRIMINATOR_MAP[discriminatorHex];
      
      if (!discriminatorInfo || discriminatorInfo.category !== 'lp_creation') {
        return null;
      }

      // Update discriminator statistics
      if (!this.metrics.discriminatorStats.has(discriminatorHex)) {
        this.metrics.discriminatorStats.set(discriminatorHex, 0);
      }
      this.metrics.discriminatorStats.set(
        discriminatorHex, 
        this.metrics.discriminatorStats.get(discriminatorHex) + 1
      );

      // Validate account count
      if (instruction.accounts.length < discriminatorInfo.minAccounts) {
        console.log(`⚠️ Insufficient accounts: ${instruction.accounts.length} < ${discriminatorInfo.minAccounts}`);
        return null;
      }

      // Extract token mints using discriminator-specific layout
      const layout = this.ACCOUNT_LAYOUTS[discriminatorHex];
      if (!layout) {
        console.warn(`⚠️ No layout found for discriminator: ${discriminatorHex}`);
        return null;
      }

      console.log(`🔍 Processing ${discriminatorInfo.type} instruction with ${instruction.accounts.length} accounts`);

      // CRITICAL: This now includes full token validation
      const tokenPair = await this.extractTokenPair(instruction.accounts, accountKeys, layout);
      if (!tokenPair) {
        return null;
--
        baseMint: tokenPair.memeToken,        // For compatibility
        quoteMint: tokenPair.quoteToken,      // For compatibility
        quoteName: tokenPair.quoteName,
        
        // Detection metadata
        discriminator: discriminatorHex,
        instructionType: discriminatorInfo.type,
        confidence: this.calculateConfidence(discriminatorInfo, tokenPair),
        detectionMethod: 'raydium_binary_discriminator_parsing',
        
        // Validation results
        tokenValidation: tokenPair.tokenValidation,
        validationConfidence: tokenPair.confidence,
        
--
  }

  /**
   * PRODUCTION: Calculate confidence score for candidate
   */
  calculateConfidence(discriminatorInfo, tokenPair) {
    let confidence = discriminatorInfo.confidence; // Base confidence from discriminator
    
    // Boost for high-quality token validation
    if (tokenPair.confidence === 'high') {
      confidence += 0.05;
    } else if (tokenPair.confidence === 'medium') {
--
        successes: this.metrics.validationSuccesses,
        failures: this.metrics.validationFailures,
        successRate: successRate,
        circuitBreakerTrips: this.metrics.circuitBreakerTrips
      },
      discriminators: Object.fromEntries(this.metrics.discriminatorStats),
      health: this.isHealthy(),
      targets: {
        maxLatency: 15.0,
        minSuccessRate: 0.95,
        minDetectionRate: 0.01
--
      totalTransactions: 0,
      lpDetections: 0,
      validationSuccesses: 0,
      validationFailures: 0,
      averageLatency: 0,
      discriminatorStats: new Map(),
      slaViolations: 0,
      circuitBreakerTrips: 0
    };
    
    console.log('📊 Raydium detector metrics reset');
rafaltracz@Rafals-MacBook-Air thorpv1 % grep -A 10 "instructionType\|discriminatorInfo" src/detection/detectors/raydium-detector.js
      const discriminatorInfo = this.DISCRIMINATOR_MAP[discriminatorHex];
      
      if (!discriminatorInfo || discriminatorInfo.category !== 'lp_creation') {
        return null;
      }

      // Update discriminator statistics
      if (!this.metrics.discriminatorStats.has(discriminatorHex)) {
        this.metrics.discriminatorStats.set(discriminatorHex, 0);
      }
      this.metrics.discriminatorStats.set(
        discriminatorHex, 
        this.metrics.discriminatorStats.get(discriminatorHex) + 1
--
      if (instruction.accounts.length < discriminatorInfo.minAccounts) {
        console.log(`⚠️ Insufficient accounts: ${instruction.accounts.length} < ${discriminatorInfo.minAccounts}`);
        return null;
      }

      // Extract token mints using discriminator-specific layout
      const layout = this.ACCOUNT_LAYOUTS[discriminatorHex];
      if (!layout) {
        console.warn(`⚠️ No layout found for discriminator: ${discriminatorHex}`);
        return null;
      }

      console.log(`🔍 Processing ${discriminatorInfo.type} instruction with ${instruction.accounts.length} accounts`);

      // CRITICAL: This now includes full token validation
      const tokenPair = await this.extractTokenPair(instruction.accounts, accountKeys, layout);
      if (!tokenPair) {
        return null;
      }

      this.metrics.lpDetections++;

      // Create production-grade LP candidate
--
        instructionType: discriminatorInfo.type,
        confidence: this.calculateConfidence(discriminatorInfo, tokenPair),
        detectionMethod: 'raydium_binary_discriminator_parsing',
        
        // Validation results
        tokenValidation: tokenPair.tokenValidation,
        validationConfidence: tokenPair.confidence,
        
        // Timestamps
        timestamp: Date.now(),
        detectedAt: Date.now(),
        
--
  calculateConfidence(discriminatorInfo, tokenPair) {
    let confidence = discriminatorInfo.confidence; // Base confidence from discriminator
    
    // Boost for high-quality token validation
    if (tokenPair.confidence === 'high') {
      confidence += 0.05;
    } else if (tokenPair.confidence === 'medium') {
      confidence -= 0.05;
    }
    
    // Boost for known quote tokens
    if (tokenPair.quoteName !== 'Unknown') {