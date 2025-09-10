/**
 * Security Configuration by Environment
 * Implements environment-specific security controls
 */

export class SecurityConfig {
  static getSecurityHeaders(environment) {
    const baseHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'same-origin'
    };
    
    if (environment === 'production') {
      return {
        ...baseHeaders,
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'X-Powered-By': null // Remove to hide technology stack
      };
    }
    
    return baseHeaders;
  }
  
  static getErrorHandling(environment) {
    const productionErrorHandling = {
      exposeStackTrace: false,
      sanitizeErrors: true,
      logErrors: true,
      genericMessages: true,
      errorResponse: (error) => ({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: 'An error occurred processing your request',
          timestamp: new Date().toISOString()
        }
      })
    };
    
    const developmentErrorHandling = {
      exposeStackTrace: true,
      sanitizeErrors: false,
      logErrors: true,
      genericMessages: false,
      errorResponse: (error) => ({
        success: false,
        error: {
          code: error.code || error.name,
          message: error.message,
          stack: error.stack,
          details: error.details || {},
          timestamp: new Date().toISOString()
        }
      })
    };
    
    return environment === 'production' ? productionErrorHandling : developmentErrorHandling;
  }
  
  static getInputValidation(environment) {
    const strictValidation = {
      maxRequestSize: '10mb',
      parameterLimit: 1000,
      validateAllInputs: true,
      sanitizeAllInputs: true,
      rejectUnknownParams: true,
      strictTypeChecking: true,
      sqlInjectionProtection: true,
      xssProtection: true,
      enableCSRF: true
    };
    
    const relaxedValidation = {
      maxRequestSize: '50mb',
      parameterLimit: 10000,
      validateAllInputs: false,
      sanitizeAllInputs: false,
      rejectUnknownParams: false,
      strictTypeChecking: false,
      sqlInjectionProtection: true,
      xssProtection: true,
      enableCSRF: false
    };
    
    return environment === 'production' ? strictValidation : relaxedValidation;
  }
  
  static getAuthenticationConfig(environment) {
    return {
      sessionTimeout: environment === 'production' ? 3600000 : 86400000, // 1hr vs 24hr
      requireStrongPasswords: environment === 'production',
      maxLoginAttempts: environment === 'production' ? 5 : 100,
      lockoutDuration: environment === 'production' ? 900000 : 0, // 15min vs none
      requireMFA: environment === 'production' && process.env.REQUIRE_MFA === 'true',
      jwtExpiration: environment === 'production' ? '1h' : '24h',
      refreshTokenExpiration: environment === 'production' ? '7d' : '30d'
    };
  }
  
  static getCryptoConfig(environment) {
    return {
      algorithm: 'aes-256-gcm',
      keyDerivation: 'scrypt',
      saltLength: 32,
      iterations: environment === 'production' ? 100000 : 10000,
      keyLength: 32,
      tagLength: 16,
      encoding: 'base64'
    };
  }
  
  static getNetworkSecurity(environment) {
    return {
      enableHTTPS: environment === 'production',
      enableHTTP2: environment === 'production',
      tlsMinVersion: environment === 'production' ? 'TLSv1.2' : 'TLSv1',
      cipherSuites: environment === 'production' ? [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384'
      ] : null,
      trustProxy: environment === 'production',
      proxyTrustedIPs: environment === 'production' ? ['127.0.0.1', '::1'] : []
    };
  }
  
  static getAuditConfig(environment) {
    return {
      enableAuditLog: true,
      auditLevel: environment === 'production' ? 'critical' : 'all',
      logSuccessfulAuth: environment === 'production',
      logFailedAuth: true,
      logDataAccess: environment === 'production',
      logConfigChanges: true,
      retentionDays: environment === 'production' ? 90 : 7,
      encryptAuditLogs: environment === 'production'
    };
  }
  
  static applySecurityMiddleware(app, environment) {
    const security = {
      headers: this.getSecurityHeaders(environment),
      errorHandling: this.getErrorHandling(environment),
      validation: this.getInputValidation(environment),
      authentication: this.getAuthenticationConfig(environment),
      crypto: this.getCryptoConfig(environment),
      network: this.getNetworkSecurity(environment),
      audit: this.getAuditConfig(environment)
    };
    
    // Log security configuration (sanitized)
    console.log('[SECURITY] Applying security configuration for:', environment);
    console.log('[SECURITY] HTTPS:', security.network.enableHTTPS);
    console.log('[SECURITY] Rate limiting:', environment === 'production' ? 'enabled' : 'disabled');
    console.log('[SECURITY] CSRF protection:', security.validation.enableCSRF);
    console.log('[SECURITY] Audit logging:', security.audit.enableAuditLog);
    
    return security;
  }
}

export default SecurityConfig;