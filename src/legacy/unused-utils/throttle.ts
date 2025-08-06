// LEGACY: archived 2025-06-09 - globalRpcThrottler not used in modular system
import { RequestThrottler } from '../src/utils/request-throttler';

export const globalRpcThrottler = new RequestThrottler({
  maxRequests: 10,
  perMilliseconds: 1000
});