import { describe, it, beforeEach, afterEach, jest, expect } from '@jest/globals';
import mongoose from 'mongoose';
import priorityQueueSystem from '../services/priority-queue-system';

// Mock mongoose
jest.mock('mongoose');
const mockedMongoose = mongoose as jest.Mocked<typeof mongoose>;

describe('Priority Queue System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should calculate priority score correctly', async () => {
    // Access private methods for testing
    const queueSystem = priorityQueueSystem as any;
    
    // Mock dependencies
    queueSystem.checkSmartWallet = jest.fn().mockResolvedValue(true);
    queueSystem.isKnownContract = jest.fn().mockResolvedValue(true);
    
    // Test transaction
    const transaction = {
      hash: '0x123',
      from: '0xabc',
      to: '0xdef',
      value: '10000000000000000000', // 10 ETH
      gasPrice: '100000000000', // 100 Gwei
      gas: '21000',
      input: '0x123456', // Contract interaction
      timestamp: Math.floor(Date.now() / 1000) - 30, // 30 seconds old
      network: 'ethereum'
    };
    
    // Calculate score
    const score = await queueSystem.calculatePriorityScore(transaction);
    
    // Verify score components:
    // - Smart wallet: 30 points
    // - Value (10 ETH): 20 points
    // - Gas price (100 Gwei): 10 points
    // - Contract interaction: 15 points
    // - Known contract: 10 points
    // - Recency (< 60s): 10 points
    // Total should be: 95 points
    expect(score).toBe(95);
  });

  it('should determine priority tier correctly', () => {
    // Access private methods for testing
    const queueSystem = priorityQueueSystem as any;
    
    // Test various scores
    expect(queueSystem.determinePriorityTier(100)).toBe('high');
    expect(queueSystem.determinePriorityTier(50)).toBe('high');
    expect(queueSystem.determinePriorityTier(49)).toBe('medium');
    expect(queueSystem.determinePriorityTier(20)).toBe('medium');
    expect(queueSystem.determinePriorityTier(19)).toBe('low');
    expect(queueSystem.determinePriorityTier(0)).toBe('low');
  });

  it('should add transaction to priority queue', async () => {
    // Mock Transaction.updateOne
    const updateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    mockedMongoose.models.Transaction = {
      updateOne: updateOneMock
    } as any;
    
    // Access private methods for testing
    const queueSystem = priorityQueueSystem as any;
    
    // Mock dependencies
    queueSystem.calculatePriorityScore = jest.fn().mockResolvedValue(80);
    queueSystem.determinePriorityTier = jest.fn().mockReturnValue('high');
    
    // Test transaction
    const transaction = {
      hash: '0x123',
      blockNumber: 123456,
      from: '0xabc',
      to: '0xdef',
      value: '1000000000000000000',
      gasPrice: '50000000000',
      gas: '21000',
      input: '0x',
      timestamp: Math.floor(Date.now() / 1000),
      network: 'ethereum'
    };
    
    // Add to queue
    const result = await priorityQueueSystem.addTransaction(transaction);
    
    // Verify
    expect(queueSystem.calculatePriorityScore).toHaveBeenCalledWith(transaction);
    expect(queueSystem.determinePriorityTier).toHaveBeenCalledWith(80);
    expect(updateOneMock).toHaveBeenCalledWith(
      { hash: '0x123' },
      expect.objectContaining({
        priority: 80,
        priorityTier: 'high'
      }),
      { upsert: true }
    );
    expect(result).toEqual({
      transaction: expect.objectContaining({
        hash: '0x123',
        priority: 80,
        priorityTier: 'high'
      }),
      priorityScore: 80,
      priorityTier: 'high'
    });
  });

  it('should process transaction batch', async () => {
    // Mock Transaction methods
    const findMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockResolvedValue([
      {
        _id: 'tx1',
        hash: '0x123',
        priorityTier: 'high',
        from: '0xabc',
        to: '0xdef'
      },
      {
        _id: 'tx2',
        hash: '0x456',
        priorityTier: 'high',
        from: '0xabc',
        to: '0xdef'
      }
    ]);
    
    const updateManyMock = jest.fn().mockResolvedValue({ modifiedCount: 2 });
    const updateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    
    mockedMongoose.models.Transaction = {
      find: findMock,
      sort: sortMock,
      limit: limitMock,
      updateMany: updateManyMock,
      updateOne: updateOneMock
    } as any;
    
    // Mock emit event
    const emitSpy = jest.spyOn(priorityQueueSystem, 'emit');
    
    // Process high priority batch
    await (priorityQueueSystem as any).processTransactionBatch('high');
    
    // Verify
    expect(findMock).toHaveBeenCalledWith(expect.objectContaining({
      priorityTier: 'high',
      processed: false
    }));
    expect(sortMock).toHaveBeenCalledWith({ priority: -1, timestamp: -1 });
    expect(limitMock).toHaveBeenCalledWith(50); // High tier batch size
    expect(updateManyMock).toHaveBeenCalledWith(
      { _id: { $in: ['tx1', 'tx2'] } },
      expect.objectContaining({
        $inc: { processingAttempts: 1 }
      })
    );
    expect(emitSpy).toHaveBeenCalledTimes(2);
    expect(emitSpy).toHaveBeenCalledWith('processTransaction', expect.anything());
    expect(updateOneMock).toHaveBeenCalledTimes(2);
  });

  it('should get queue metrics', () => {
    // Access private properties
    const queueSystem = priorityQueueSystem as any;
    
    // Set test metrics
    queueSystem.metrics = {
      queued: { high: 10, medium: 20, low: 30 },
      processed: { high: 5, medium: 10, low: 15 },
      failed: { high: 1, medium: 2, low: 3 },
      processing: { high: 1, medium: 0, low: 1 }
    };
    
    // Get metrics
    const metrics = priorityQueueSystem.getMetrics();
    
    // Verify
    expect(metrics).toEqual({
      queued: { high: 10, medium: 20, low: 30 },
      processed: { high: 5, medium: 10, low: 15 },
      failed: { high: 1, medium: 2, low: 3 },
      processing: { high: 1, medium: 0, low: 1 }
    });
  });

  it('should get queue status', async () => {
    // Mock Transaction aggregation and counts
    const aggregateMock = jest.fn().mockResolvedValue([
      { _id: 'high', count: 10, avgPriority: 75 },
      { _id: 'medium', count: 20, avgPriority: 35 },
      { _id: 'low', count: 30, avgPriority: 15 }
    ]);
    
    const countDocumentsMock = jest.fn()
      .mockResolvedValueOnce(100) // recentlyProcessed
      .mockResolvedValueOnce(5);  // recentlyFailed
    
    mockedMongoose.models.Transaction = {
      aggregate: aggregateMock,
      countDocuments: countDocumentsMock
    } as any;
    
    // Access private properties
    const queueSystem = priorityQueueSystem as any;
    
    // Set test metrics
    queueSystem.metrics = {
      queued: { high: 10, medium: 20, low: 30 },
      processed: { high: 5, medium: 10, low: 15 },
      failed: { high: 1, medium: 2, low: 3 },
      processing: { high: 1, medium: 0, low: 1 }
    };
    
    // Get status
    const status = await priorityQueueSystem.getQueueStatus();
    
    // Verify
    expect(status).toEqual({
      pending: [
        { _id: 'high', count: 10, avgPriority: 75 },
        { _id: 'medium', count: 20, avgPriority: 35 },
        { _id: 'low', count: 30, avgPriority: 15 }
      ],
      recentlyProcessed: 100,
      recentlyFailed: 5,
      processing: { high: 1, medium: 0, low: 1 },
      currentRate: {
        processed: { high: 5, medium: 10, low: 15 },
        failed: { high: 1, medium: 2, low: 3 }
      }
    });
  });
});