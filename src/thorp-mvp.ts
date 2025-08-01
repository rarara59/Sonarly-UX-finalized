import { TokenPreFilterService, NewTokenEvent } from './services/token-pre-filter.service';

// Mocked list of new tokens for now — later this will be real token data from your pipeline
const allTokens: NewTokenEvent[] = [
  {
    address: 'ABC123',
    name: 'DogCoin',
    symbol: 'DOG',
    lpValueUSD: 12000,
    uniqueHolders: 55,
    buyTransactions: 22,
    dex: 'Raydium',
    hasMintAuthority: false,
    hasFreezeAuthority: false,
    largestHolderPercentage: 12.5,
    firstSeenTimestamp: Date.now() - 60 * 1000, // 1 minute ago
    currentTimestamp: Date.now(),
    smartWalletsInteracted: []
  },
  {
    address: 'DEF456',
    name: '',
    symbol: '',
    lpValueUSD: 1000,
    uniqueHolders: 4,
    buyTransactions: 1,
    dex: 'UnknownDex',
    hasMintAuthority: true,
    hasFreezeAuthority: true,
    largestHolderPercentage: 99,
    firstSeenTimestamp: Date.now() - 600000,
    currentTimestamp: Date.now(),
    smartWalletsInteracted: []
  }
];

// This is where you evaluate each token using your filter
const candidates = allTokens
  .map(t => ({ token: t, result: TokenPreFilterService.evaluateToken(t) }))
  .filter(t => t.result.passed)
  .map(t => t.token);

// Print the tokens that passed the filter
console.log('Qualified Tokens:', candidates);