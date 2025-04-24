// src/services/__tests__/smart-wallet.service.test.ts
import { Model } from 'mongoose';
import { SmartWalletService, AverageMetrics } from '../smart-wallet.service';
import { ISmartWallet } from '../../models/smart-wallet.model';

// Mock the logger to avoid actual logging during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Create a mock Model instance
const createMockModel = () => {
  const mockModel = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    aggregate: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    save: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockImplementation(function(this: any) {
      return Promise.resolve(this._mockData || []);
    }),
    _mockData: [] as any[],
    // Helper to set mock data for tests
    __setMockData: function(data: any[]) {
      this._mockData = data;
      return this;
    },
  };
  
  // Also mock the constructor for new Model()
  const MockModelConstructor = jest.fn().mockImplementation((data) => {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(data),
    };
  });
  
  return { mockModel, MockModelConstructor };
};

describe('SmartWalletService', () => {
  let service: SmartWalletService;
  let mockModel: any;
  let MockModelConstructor: any;
  
  beforeEach(() => {
    // Create fresh mocks for each test
    const mocks = createMockModel();
    mockModel = mocks.mockModel;
    MockModelConstructor = mocks.MockModelConstructor;
    
    // Create the service with the mock model
    service = new SmartWalletService(mockModel as unknown as Model<ISmartWallet>);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('findBySuccessRateRange', () => {
    it('should find wallets within success rate range with correct query', async () => {
      // Set up test data
      const testWallets = [
        { address: 'address1', successRate: 75.2 },
        { address: 'address2', successRate: 74.8 }
      ];
      mockModel.__setMockData(testWallets);
      
      // Call the method
      const result = await service.findBySuccessRateRange(74, 76);
      
      // Verify the query was created correctly
      expect(mockModel.find).toHaveBeenCalledWith({
        successRate: { $gte: 74, $lte: 76 },
        isVerified: true
      });
      
      // Verify sorting was applied
      expect(mockModel.sort).toHaveBeenCalledWith({ predictedSuccessRate: -1 });
      
      // Verify pagination defaults were applied
      expect(mockModel.limit).toHaveBeenCalled();
      
      // Verify the result
      expect(result).toEqual(testWallets);
    });
    
    it('should apply pagination options correctly', async () => {
      // Call the method with pagination options
      await service.findBySuccessRateRange(74, 76, { page: 2, perPage: 10 });
      
      // Verify skip was called with correct value (page - 1) * perPage
      expect(mockModel.skip).toHaveBeenCalledWith(10);
      
      // Verify limit was called with perPage
      expect(mockModel.limit).toHaveBeenCalledWith(10);
    });
    
    it('should handle errors correctly', async () => {
      // Make the mock throw an error
      mockModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Verify that the error is propagated
      await expect(service.findBySuccessRateRange()).rejects.toThrow('Database error');
    });
  });
  
  describe('getByAddress', () => {
    it('should find a wallet by address', async () => {
      const testWallet = { address: 'testAddress', successRate: 75.5 };
      mockModel.findOne.mockResolvedValue(testWallet);
      
      const result = await service.getByAddress('testAddress');
      
      expect(mockModel.findOne).toHaveBeenCalledWith({ address: 'testAddress' });
      expect(result).toEqual(testWallet);
    });
    
    it('should return null if wallet is not found', async () => {
      mockModel.findOne.mockResolvedValue(null);
      
      const result = await service.getByAddress('nonExistentAddress');
      
      expect(result).toBeNull();
    });
  });
  
  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      const walletData = { 
        address: 'newAddress', 
        successRate: 75.0,
        totalTransactions: 100
      };
      
      await service.createWallet(walletData);
      
      // Verify the constructor was called with the data
      expect(MockModelConstructor).toHaveBeenCalledWith(walletData);
    });
  });
  
  describe('getAverageMetrics', () => {
    it('should return average metrics', async () => {
      const mockAggregateResult: AverageMetrics[] = [{
        avgSuccessRate: 75.2,
        avgPredictedSuccessRate: 76.1,
        avgEarlyAdoptionScore: 8.5,
        avgProfitabilityScore: 8.2,
        avgNetworkInfluence: 7.8,
        avgHoldTime: 62.5,
        totalWallets: 5
      }];
      
      mockModel.aggregate.mockResolvedValue(mockAggregateResult);
      
      const result = await service.getAverageMetrics();
      
      expect(mockModel.aggregate).toHaveBeenCalledWith([
        {
          $match: { isVerified: true }
        },
        {
          $group: {
            _id: null,
            avgSuccessRate: { $avg: '$successRate' },
            avgPredictedSuccessRate: { $avg: '$predictedSuccessRate' },
            avgEarlyAdoptionScore: { $avg: '$earlyAdoptionScore' },
            avgProfitabilityScore: { $avg: '$profitabilityScore' },
            avgNetworkInfluence: { $avg: '$networkInfluence' },
            avgHoldTime: { $avg: '$averageHoldTime' },
            totalWallets: { $sum: 1 }
          }
        }
      ]);
      
      expect(result).toEqual(mockAggregateResult[0]);
    });
    
    it('should return null when no wallets match', async () => {
      mockModel.aggregate.mockResolvedValue([]);
      
      const result = await service.getAverageMetrics();
      
      expect(result).toBeNull();
    });
  });
  
  describe('bulkUpdate', () => {
    it('should update multiple wallets matching a query', async () => {
      mockModel.updateMany.mockResolvedValue({
        matchedCount: 5,
        modifiedCount: 3
      });
      
      const query = { successRate: { $gt: 70 } };
      const update = { $set: { isVerified: true } };
      
      const result = await service.bulkUpdate(query, update);
      
      expect(mockModel.updateMany).toHaveBeenCalledWith(query, update);
      expect(result).toEqual({
        matchedCount: 5,
        modifiedCount: 3
      });
    });
  });
});