// src/validation/simple-validator.js
import { PublicKey } from '@solana/web3.js';

export class SimpleValidator {
  static validateAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }
  
  static validateMethod(method) {
    const allowed = [
      'getAccountInfo', 'getTokenSupply', 'getMultipleAccounts',
      'getTransaction', 'getProgramAccounts', 'getTokenAccountsByOwner'
    ];
    return allowed.includes(method);
  }
  
  static validateParams(method, params) {
    switch (method) {
      case 'getAccountInfo':
      case 'getTokenSupply':
        return params.length > 0 && this.validateAddress(params[0]);
      case 'getMultipleAccounts':
        return Array.isArray(params[0]) && params[0].every(addr => this.validateAddress(addr));
      default:
        return true;
    }
  }
}