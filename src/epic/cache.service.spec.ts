import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import { CacheService } from './cache.service';

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
  },
}));

describe('CacheService', () => {
  let service: CacheService;
  let mockLogger: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  beforeEach(async () => {
    // Create mock logger
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CacheService,
          useFactory: () => {
            const cacheService = new CacheService();
            // Replace the logger instance with our mock
            Object.defineProperty(cacheService, 'logger', {
              value: mockLogger,
              writable: true,
            });
            return cacheService;
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getCachedData', () => {
    const mockCachePath = '/test/cache/path.json';
    const mockCachedData = { test: 'data', timestamp: '2024-01-01' };

    it('should return cached data when file exists and is valid JSON', async () => {
      // Mock fileExists to return true
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);

      // Mock fs.readFile to return valid JSON string
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCachedData),
      );

      const result = await service.getCachedData(mockCachePath);

      expect(result).toEqual(mockCachedData);
      expect(service.fileExists).toHaveBeenCalledWith(mockCachePath);
      expect(fs.readFile).toHaveBeenCalledWith(mockCachePath, 'utf-8');
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Returning cached data from: ${mockCachePath}`,
      );
    });

    it('should return null when file does not exist', async () => {
      // Mock fileExists to return false
      jest.spyOn(service, 'fileExists').mockResolvedValue(false);

      const result = await service.getCachedData(mockCachePath);

      expect(result).toBeNull();
      expect(service.fileExists).toHaveBeenCalledWith(mockCachePath);
      expect(fs.readFile).not.toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
    });

    it('should return null and log warning when file read fails', async () => {
      // Mock fileExists to return true
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);

      // Mock fs.readFile to throw an error
      const mockError = new Error('File read error');
      (fs.readFile as jest.Mock).mockRejectedValue(mockError);

      const result = await service.getCachedData(mockCachePath);

      expect(result).toBeNull();
      expect(service.fileExists).toHaveBeenCalledWith(mockCachePath);
      expect(fs.readFile).toHaveBeenCalledWith(mockCachePath, 'utf-8');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Error reading cache from ${mockCachePath}:`,
        mockError.message,
      );
    });

    it('should return null and log warning when JSON parsing fails', async () => {
      // Mock fileExists to return true
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);

      // Mock fs.readFile to return invalid JSON string
      (fs.readFile as jest.Mock).mockResolvedValue('invalid json content');

      const result = await service.getCachedData(mockCachePath);

      expect(result).toBeNull();
      expect(service.fileExists).toHaveBeenCalledWith(mockCachePath);
      expect(fs.readFile).toHaveBeenCalledWith(mockCachePath, 'utf-8');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Error reading cache from ${mockCachePath}:`,
        expect.any(String),
      );
    });

    it('should return null and log warning when fileExists throws an error', async () => {
      // Mock fileExists to throw an error
      const mockError = new Error('Access denied');
      jest.spyOn(service, 'fileExists').mockRejectedValue(mockError);

      const result = await service.getCachedData(mockCachePath);

      expect(result).toBeNull();
      expect(service.fileExists).toHaveBeenCalledWith(mockCachePath);
      expect(fs.readFile).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Error reading cache from ${mockCachePath}:`,
        mockError.message,
      );
    });

    it('should handle generic type correctly', async () => {
      // Mock fileExists to return true
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);

      // Mock fs.readFile to return valid JSON string
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockCachedData),
      );

      // Test with explicit generic type
      const result =
        await service.getCachedData<typeof mockCachedData>(mockCachePath);

      expect(result).toEqual(mockCachedData);
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('test');
      expect(result).toHaveProperty('timestamp');
    });

    it('should handle empty JSON object', async () => {
      // Mock fileExists to return true
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);

      // Mock fs.readFile to return empty JSON object
      (fs.readFile as jest.Mock).mockResolvedValue('{}');

      const result = await service.getCachedData(mockCachePath);

      expect(result).toEqual({});
      expect(service.fileExists).toHaveBeenCalledWith(mockCachePath);
      expect(fs.readFile).toHaveBeenCalledWith(mockCachePath, 'utf-8');
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Returning cached data from: ${mockCachePath}`,
      );
    });

    it('should handle array data correctly', async () => {
      // Mock fileExists to return true
      jest.spyOn(service, 'fileExists').mockResolvedValue(true);

      const mockArrayData = ['item1', 'item2', 'item3'];
      (fs.readFile as jest.Mock).mockResolvedValue(
        JSON.stringify(mockArrayData),
      );

      const result = await service.getCachedData<string[]>(mockCachePath);

      expect(result).toEqual(mockArrayData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);

      const result = await service.fileExists('/test/file.txt');

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/test/file.txt');
    });

    it('should return false when file does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await service.fileExists('/test/nonexistent.txt');

      expect(result).toBe(false);
      expect(fs.access).toHaveBeenCalledWith('/test/nonexistent.txt');
    });
  });
});
