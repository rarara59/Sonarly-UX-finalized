import { describe, it, beforeEach, afterEach, jest, expect } from '@jest/globals';
import axios from 'axios';
import rpcConnectionManager from '../services/rpc-connection-manager';
import config from '../config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RPC Connection Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should select the best endpoint based on health', () => {
    // Access private property for testing
    const manager = rpcConnectionManager as any;
    
    // Set up test data
    manager.endpoints = {
      drpc: {
        url: 'https://drpc.io/eth',
        apiKey: 'test-key',
        rateLimit: 250,
        active: true,
        health: 90,
        responseTime: 100,
        failCount: 0,
        lastCall: 0,
        callCount: 10
      },
      chainstack: {
        url: 'https://chainstack.io/eth',
        apiKey: 'test-key-2',
        rateLimit: 250,
        active: true,
        health: 95,
        responseTime: 150,
        failCount: 1,
        lastCall: 0,
        callCount: 5
      }
    };

    // Test
    const bestEndpoint = manager.getBestEndpoint();
    
    // Since chainstack has higher health, it should be selected
    expect(bestEndpoint).toBe('chainstack');
  });

  it('should select endpoint based on response time when health is equal', () => {
    // Access private property for testing
    const manager = rpcConnectionManager as any;
    
    // Set up test data
    manager.endpoints = {
      drpc: {
        url: 'https://drpc.io/eth',
        apiKey: 'test-key',
        rateLimit: 250,
        active: true,
        health: 90,
        responseTime: 50, // Faster response time
        failCount: 0,
        lastCall: 0,
        callCount: 10
      },
      chainstack: {
        url: 'https://chainstack.io/eth',
        apiKey: 'test-key-2',
        rateLimit: 250,
        active: true,
        health: 90, // Same health
        responseTime: 150,
        failCount: 1,
        lastCall: 0,
        callCount: 5
      }
    };

    // Test
    const bestEndpoint = manager.getBestEndpoint();
    
    // Since health is equal but drpc has better response time, it should be selected
    expect(bestEndpoint).toBe('drpc');
  });

  it('should send RPC request successfully', async () => {
    // Mock successful response
    const mockResponse = {
      data: {
        jsonrpc: '2.0',
        id: 1,
        result: '0xa41d63'
      }
    };
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse);

    // Test
    const result = await rpcConnectionManager.sendRequest('eth_blockNumber', []);
    
    // Verify
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockResponse.data);
  });

  it('should use cache when available', async () => {
    // Access private properties for testing
    const manager = rpcConnectionManager as any;
    
    // Set up cache
    const cacheKey = 'eth_blockNumber_[]';
    const cachedData = {
      data: { result: '0xa41d63' },
      timestamp: Date.now()
    };
    manager.cache.set(cacheKey, cachedData);
    
    // Test
    const result = await rpcConnectionManager.sendRequest('eth_blockNumber', [], cacheKey);
    
    // Verify axios was not called because cache was used
    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(result).toEqual(cachedData.data);
  });

  it('should try fallback endpoint on failure', async () => {
    // Access private property for testing
    const manager = rpcConnectionManager as any;
    
    // Set up endpoints
    manager.endpoints = {
      drpc: {
        url: 'https://drpc.io/eth',
        apiKey: 'test-key',
        rateLimit: 250,
        active: true,
        health: 90,
        responseTime: 100,
        failCount: 0,
        lastCall: 0,
        callCount: 10
      },
      chainstack: {
        url: 'https://chainstack.io/eth',
        apiKey: 'test-key-2',
        rateLimit: 250,
        active: true,
        health: 80,
        responseTime: 150,
        failCount: 1,
        lastCall: 0,
        callCount: 5
      }
    };
    
    // First request fails, second succeeds
    mockedAxios.post.mockRejectedValueOnce(new Error('RPC Error'))
      .mockResolvedValueOnce({
        data: {
          jsonrpc: '2.0',
          id: 1,
          result: '0xa41d63'
        }
      });
    
    // Override getBestEndpoint to always return drpc first for testing
    const originalGetBestEndpoint = manager.getBestEndpoint;
    manager.getBestEndpoint = jest.fn().mockReturnValueOnce('drpc');
    
    // Test
    const result = await rpcConnectionManager.sendRequest('eth_blockNumber', []);
    
    // Verify
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: '0xa41d63'
    });
    
    // Restore original function
    manager.getBestEndpoint = originalGetBestEndpoint;
  });

  it('should update endpoint health based on success/failure', () => {
    // Access private property for testing
    const manager = rpcConnectionManager as any;
    
    // Set up test endpoint
    manager.endpoints = {
      testEndpoint: {
        url: 'https://test.io/eth',
        apiKey: 'test-key',
        rateLimit: 250,
        active: true,
        health: 90,
        responseTime: 100,
        failCount: 0,
        lastCall: 0,
        callCount: 10
      }
    };
    
    // Test failure scenario
    manager.endpoints.testEndpoint.failCount = 5;
    manager.endpoints.testEndpoint.callCount = 10;
    manager.updateEndpointHealth('testEndpoint');
    
    // Health should decrease due to failures
    expect(manager.endpoints.testEndpoint.health).toBeLessThan(90);
    
    // Test success scenario
    manager.endpoints.testEndpoint.health = 90; // Reset
    manager.endpoints.testEndpoint.failCount = 0;
    manager.updateEndpointHealth('testEndpoint');
    
    // Health should remain high
    expect(manager.endpoints.testEndpoint.health).toBeGreaterThanOrEqual(90);
  });
});