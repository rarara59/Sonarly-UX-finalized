src/detection/validation/token-validator.js

Add proper Solana address validation to Token Validator:

// Add this method to TokenValidator class
isValidSolanaAddress(address) {
  // Basic length check (Solana addresses are typically 32-44 characters)
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }
  
  // Check for base58 characters only (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

// Update validateToken method (around line 25):
if (!this.isValidSolanaAddress(address)) {
  throw new Error(`Invalid Solana address format: ${address}`);
}