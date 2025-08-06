import { describe, it, beforeEach, afterEach, jest, expect } from '@jest/globals';
import mongoose from 'mongoose';
import axios from 'axios';
import puppeteer from 'puppeteer';
import externalWalletScraper from '../services/external-wallet-scraper';

// Mock dependencies
jest.mock('mongoose');
jest.mock('axios');
jest.mock('puppeteer');

const mockedMongoose = mongoose as jest.Mocked<typeof mongoose>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;

describe('External Wallet Scraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should initialize the scraper', async () => {
    // Mock browser instance
    const mockBrowser = {
      newPage: jest.fn()
    };
    mockedPuppeteer.launch.mockResolvedValue(mockBrowser as any);
    
    // Test initialization
    const result = await externalWalletScraper.init();
    
    // Verify browser was launched
    expect(mockedPuppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({
      headless: true,
      args: expect.arrayContaining([
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ])
    }));
    expect(result).toBe(true);
  });

  it('should scrape data from Dune API', async () => {
    // Mock axios response
    mockedAxios.get.mockResolvedValue({
      data: {
        wallets: [
          {
            address: '0x123abc',
            name: 'Smart Trader 1',
            tags: ['defi', 'whale'],
            category: 'trader',
            success_rate: 85.5,
            total_trades: 120,
            profitable_trades: 103,
            average_return: 23.4,
            followers: 250,
            id: 'dune-1'
          },
          {
            address: '0x456def',
            name: 'Early Adopter',
            tags: ['early', 'nft'],
            category: 'nft',
            success_rate: 76.2,
            total_trades: 84,
            profitable_trades: 64,
            average_return: 18.7,
            followers: 150,
            id: 'dune-2'
          }
        ]
      }
    });
    
    // Access private methods for testing
    const scraper = externalWalletScraper as any;
    
    // Test Dune scraping
    const walletData = await scraper.scrapeDune();
    
    // Verify API call was made correctly
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/smart-wallets'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer ')
        })
      })
    );
    
    // Verify result transformation
    expect(walletData).toHaveLength(2);
    expect(walletData[0]).toEqual({
      address: '0x123abc',
      label: 'Smart Trader 1',
      tags: ['defi', 'whale'],
      category: 'trader',
      performance: {
        successRate: 85.5,
        totalTrades: 120,
        profitableTrades: 103,
        averageReturn: 23.4
      },
      followersCount: 250,
      externalId: 'dune-1'
    });
  });

  it('should process wallet data correctly', async () => {
    // Mock mongoose model methods
    const findOneMock = jest.fn();
    const updateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const saveMock = jest.fn().mockResolvedValue({ _id: 'new-wallet-id' });
    
    // Mock existing wallet
    findOneMock.mockResolvedValueOnce({
      address: '0x123abc',
      source: 'dune',
      label: 'Old Label',
      tags: ['old-tag'],
      performance: {
        successRate: 80,
        totalTrades: 100
      },
      metadataVersion: 1,
      toObject: () => ({
        address: '0x123abc',
        source: 'dune',
        label: 'Old Label',
        tags: ['old-tag'],
        performance: {
          successRate: 80,
          totalTrades: 100
        },
        metadataVersion: 1
      })
    });
    
    // Mock new wallet (not found)
    findOneMock.mockResolvedValueOnce(null);
    
    // Setup mongoose mocks
    mockedMongoose.models.ExternalWallet = {
      findOne: findOneMock,
      updateOne: updateOneMock
    } as any;
    
    mockedMongoose.models.WalletPerformanceHistory = {
      save: saveMock
    } as any;
    
    // Constructor mocks
    const mockExternalWallet = function(this: any, data: any) {
      Object.assign(this, data);
      this.save = saveMock;
    } as any;
    
    const mockWalletPerformanceHistory = function(this: any, data: any) {
      Object.assign(this, data);
      this.save = saveMock;
    } as any;
    
    mockedMongoose.model.mockReturnValueOnce(mockExternalWallet)
      .mockReturnValueOnce(mockWalletPerformanceHistory);
    
    // Access private methods for testing
    const scraper = externalWalletScraper as any;
    
    // Mock helper method
    scraper.shouldCreatePerformanceHistory = jest.fn().mockReturnValue(true);
    scraper.createPerformanceHistoryRecord = jest.fn().mockResolvedValue(undefined);
    
    // Test data
    const walletData = [
      {
        // Existing wallet with updates
        address: '0x123abc',
        label: 'Updated Label',
        tags: ['new-tag', 'defi'],
        category: 'trader',
        performance: {
          successRate: 85,
          totalTrades: 110
        },
        followersCount: 250,
        externalId: 'dune-1'
      },
      {
        // New wallet
        address: '0x456def',
        label: 'New Wallet',
        tags: ['nft', 'early'],
        category: 'nft',
        performance: {
          successRate: 75,
          totalTrades: 50
        },
        followersCount: 100,
        externalId: 'dune-2'
      }
    ];
    
    // Process wallet data
    await scraper.processWalletData(walletData, 'dune');
    
    // Verify existing wallet was updated
    expect(findOneMock).toHaveBeenCalledWith({ address: '0x123abc' });
    expect(updateOneMock).toHaveBeenCalledWith(
      { address: '0x123abc' },
      { $set: expect.objectContaining({
        label: 'Updated Label',
        tags: ['new-tag', 'defi'],
        category: 'trader',
        followersCount: 250,
        metadataVersion: 2,
        performance: expect.objectContaining({
          successRate: 85,
          totalTrades: 110
        })
      })}
    );
    
    // Verify new wallet was created
    expect(findOneMock).toHaveBeenCalledWith({ address: '0x456def' });
    expect(saveMock).toHaveBeenCalled();
    
    // Verify performance history was created
    expect(scraper.createPerformanceHistoryRecord).toHaveBeenCalledTimes(2);
  });

  it('should determine if performance history should be created', () => {
    // Access private methods for testing
    const scraper = externalWalletScraper as any;
    
    // Test cases
    
    // Case 1: No existing performance data
    const existingWallet1 = {
      address: '0x123',
      performance: null,
      lastUpdated: new Date()
    };
    
    const newWalletData1 = {
      address: '0x123',
      performance: {
        successRate: 80,
        totalTrades: 100
      }
    };
    
    expect(scraper.shouldCreatePerformanceHistory(existingWallet1, newWalletData1)).toBe(true);
    
    // Case 2: Significant increase in total trades
    const existingWallet2 = {
      address: '0x123',
      performance: {
        successRate: 80,
        totalTrades: 100
      },
      lastUpdated: new Date()
    };
    
    const newWalletData2 = {
      address: '0x123',
      performance: {
        successRate: 80,
        totalTrades: 110 // +10 trades (more than 5)
      }
    };
    
    expect(scraper.shouldCreatePerformanceHistory(existingWallet2, newWalletData2)).toBe(true);
    
    // Case 3: Significant change in success rate
    const existingWallet3 = {
      address: '0x123',
      performance: {
        successRate: 80,
        totalTrades: 100
      },
      lastUpdated: new Date()
    };
    
    const newWalletData3 = {
      address: '0x123',
      performance: {
        successRate: 87, // +7% (more than 5%)
        totalTrades: 102
      }
    };
    
    expect(scraper.shouldCreatePerformanceHistory(existingWallet3, newWalletData3)).toBe(true);
    
    // Case 4: Last update more than 7 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    
    const existingWallet4 = {
      address: '0x123',
      performance: {
        successRate: 80,
        totalTrades: 100
      },
      lastUpdated: oldDate
    };
    
    const newWalletData4 = {
      address: '0x123',
      performance: {
        successRate: 81,
        totalTrades: 101
      }
    };
    
    expect(scraper.shouldCreatePerformanceHistory(existingWallet4, newWalletData4)).toBe(true);
    
    // Case 5: Minor changes, recent update
    const existingWallet5 = {
      address: '0x123',
      performance: {
        successRate: 80,
        totalTrades: 100
      },
      lastUpdated: new Date()
    };
    
    const newWalletData5 = {
      address: '0x123',
      performance: {
        successRate: 81, // Only +1%
        totalTrades: 102 // Only +2 trades
      }
    };
    
    expect(scraper.shouldCreatePerformanceHistory(existingWallet5, newWalletData5)).toBe(false);
  });

  it('should filter and sort wallets when searching', async () => {
    // Mock mongoose model methods
    const findMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockReturnThis();
    const limitMock = jest.fn().mockReturnThis();
    const skipMock = jest.fn().mockResolvedValue([
      { address: '0x123', category: 'trader', tags: ['defi'] },
      { address: '0x456', category: 'trader', tags: ['defi'] }
    ]);
    
    const countDocumentsMock = jest.fn().mockResolvedValue(10);
    
    mockedMongoose.models.ExternalWallet = {
      find: findMock,
      sort: sortMock,
      limit: limitMock,
      skip: skipMock,
      countDocuments: countDocumentsMock
    } as any;
    
    // Test with filters
    const filterOptions = {
      category: 'trader',
      tags: ['defi'],
      minSuccessRate: 70,
      minTrades: 50,
      sortBy: 'performance' as 'performance',
      limit: 10,
      skip: 0
    };
    
    // Get filtered wallets
    const result = await externalWalletScraper.getSmartWallets(filterOptions);
    
    // Verify query
    expect(findMock).toHaveBeenCalledWith({
      category: 'trader',
      tags: { $in: ['defi'] },
      'performance.successRate': { $gte: 70 },
      'performance.totalTrades': { $gte: 50 }
    });
    
    // Verify sorting
    expect(sortMock).toHaveBeenCalledWith({
      'performance.successRate': -1
    });
    
    // Verify pagination
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(skipMock).toHaveBeenCalledWith(0);
    
    // Verify result
    expect(result).toEqual({
      wallets: [
        { address: '0x123', category: 'trader', tags: ['defi'] },
        { address: '0x456', category: 'trader', tags: ['defi'] }
      ],
      totalCount: 10,
      page: 1,
      pageSize: 10,
      pageCount: 1
    });
  });

  it('should get wallet performance history', async () => {
    // Mock mongoose model methods
    const findMock = jest.fn().mockReturnThis();
    const sortMock = jest.fn().mockResolvedValue([
      {
        walletAddress: '0x123',
        date: new Date('2023-01-01'),
        successRate: 75,
        totalTrades: 80
      },
      {
        walletAddress: '0x123',
        date: new Date('2023-01-15'),
        successRate: 78,
        totalTrades: 90
      }
    ]);
    
    mockedMongoose.models.WalletPerformanceHistory = {
      find: findMock,
      sort: sortMock
    } as any;
    
    // Get history for a 30-day period
    const history = await externalWalletScraper.getWalletPerformanceHistory('0x123', 30);
    
    // Verify query
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    expect(findMock).toHaveBeenCalledWith({
      walletAddress: '0x123',
      date: { $gte: expect.any(Date) }
    });
    
    expect(sortMock).toHaveBeenCalledWith({ date: 1 });
    
    // Verify result
    expect(history).toHaveLength(2);
    expect(history[0].successRate).toBe(75);
    expect(history[1].successRate).toBe(78);
  });

  it('should get scraper statistics', () => {
    // Access private properties
    const scraper = externalWalletScraper as any;
    
    // Set test stats
    scraper.stats = {
      totalScraped: 150,
      newWallets: 50,
      updatedWallets: 100,
      failedWallets: 5,
      lastScrapeTime: new Date(),
      scrapingInProgress: false
    };
    
    // Get stats
    const stats = externalWalletScraper.getStats();
    
    // Verify
    expect(stats).toEqual({
      totalScraped: 150,
      newWallets: 50,
      updatedWallets: 100,
      failedWallets: 5,
      lastScrapeTime: expect.any(Date),
      scrapingInProgress: false
    });
  });

  it('should force scrape a specific source', async () => {
    // Access private methods and properties
    const scraper = externalWalletScraper as any;
    
    // Mock scrapeSource method
    scraper.scrapeSource = jest.fn().mockResolvedValue(undefined);
    
    // Set up source
    scraper.sources = {
      dune: {
        enabled: true,
        url: 'https://dune.com',
        authToken: 'token',
        fetchInterval: 3600000,
        lastFetch: Date.now() - 1000000, // Set last fetch to some time ago
        requiresLogin: false
      }
    };
    
    // Force scrape
    await externalWalletScraper.forceScrape('dune');
    
    // Verify lastFetch was reset and scrapeSource was called
    expect(scraper.sources.dune.lastFetch).toBe(0);
    expect(scraper.scrapeSource).toHaveBeenCalledWith('dune');
  });

  it('should throw error for unknown source when force scraping', async () => {
    // Try to force scrape unknown source
    await expect(externalWalletScraper.forceScrape('unknown')).rejects.toThrow('Unknown source: unknown');
  });

  it('should properly shut down resources', async () => {
    // Mock browser close method
    const closeMock = jest.fn().mockResolvedValue(undefined);
    (externalWalletScraper as any).browser = {
      close: closeMock
    };
    
    // Shutdown
    await externalWalletScraper.shutdown();
    
    // Verify browser was closed
    expect(closeMock).toHaveBeenCalled();
  });
});