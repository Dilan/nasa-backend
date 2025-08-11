import { Test, TestingModule } from '@nestjs/testing';
import { EpicService } from './epic.service';
import { NasaApiService } from '../nasa-api/nasa-api.service';
import { CacheService } from './cache.service';
import { QueryEpicDto } from './dto/query-epic.dto';

describe('EpicService', () => {
  let service: EpicService;
  const mockEpicImage = {
    identifier: '20190530011359',
    caption:
      "This image was taken by NASA's EPIC camera onboard the NOAA DSCOVR spacecraft",
    image: 'epic_1b_20190530011359',
    version: '03',
    date: '2019-05-30 01:09:10',
  };

  const mockNasaApiService = {
    getAvailableDates: jest.fn(),
    getEpicImages: jest.fn(),
    getEpicImageByIdentifier: jest.fn(),
    saveEpicImageByIdentifier: jest.fn(),
  };

  const mockCacheService = {
    getCachedData: jest.fn(),
    setCachedData: jest.fn(),
    fileExists: jest.fn(),
    validatePngFile: jest.fn(),
    removeCorruptedFile: jest.fn(),
    waitForFileStability: jest.fn(),
    getCachePath: jest.fn(),
    getImageCachePath: jest.fn(),
    ensureCacheDirectory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpicService,
        {
          provide: NasaApiService,
          useValue: mockNasaApiService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<EpicService>(EpicService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableDates', () => {
    it('should get available dates from NASA API', async () => {
      const type = 'natural';
      const expectedResponse = {
        data: ['2019-05-30', '2019-05-29'],
        status: 'success',
      };

      mockNasaApiService.getAvailableDates.mockResolvedValue(expectedResponse);

      const result = await service.getAvailableDates(type);

      expect(result).toEqual(expectedResponse);
      expect(mockNasaApiService.getAvailableDates).toHaveBeenCalledWith(type);
    });

    it('should use natural type by default', async () => {
      const expectedResponse = {
        data: ['2019-05-30'],
        status: 'success',
      };

      mockNasaApiService.getAvailableDates.mockResolvedValue(expectedResponse);

      const result = await service.getAvailableDates();

      expect(result).toEqual(expectedResponse);
      expect(mockNasaApiService.getAvailableDates).toHaveBeenCalledWith(
        'natural',
      );
    });
  });

  describe('getEpicImages', () => {
    it('should get EPIC images from cache when available', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: true };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        data: expectedImages,
        status: 'cached',
      };

      const cachePath = '/test/cache/2019-05-30_2019-05-30_natural.json';

      // Mock cache service
      mockCacheService.getCachePath.mockReturnValue(cachePath);
      mockCacheService.getCachedData.mockResolvedValue(expectedImages);

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(mockCacheService.getCachedData).toHaveBeenCalledWith(cachePath);
      expect(mockNasaApiService.getEpicImages).not.toHaveBeenCalled();
    });

    it('should get EPIC images from NASA API when cache miss and cache the response', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: true };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        data: expectedImages,
        status: 'success',
      };

      const cachePath = '/test/cache/2019-05-30_2019-05-30_natural.json';

      // Mock cache service
      mockCacheService.getCachePath.mockReturnValue(cachePath);
      mockCacheService.getCachedData.mockResolvedValue(null);
      mockCacheService.setCachedData.mockResolvedValue(undefined);

      // Mock NASA API
      mockNasaApiService.getEpicImages.mockResolvedValue(expectedResponse);

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(mockCacheService.getCachedData).toHaveBeenCalledWith(cachePath);
      expect(mockNasaApiService.getEpicImages).toHaveBeenCalledWith(
        '2019-05-30',
        'natural',
      );
      expect(mockCacheService.setCachedData).toHaveBeenCalledWith(
        cachePath,
        expectedImages,
      );
    });

    it('should get EPIC images with enhanced parameter', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: false };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        data: expectedImages,
        status: 'success',
      };

      const cachePath = '/test/cache/2019-05-30_2019-05-30_enhanced.json';

      // Mock cache service
      mockCacheService.getCachePath.mockReturnValue(cachePath);
      mockCacheService.getCachedData.mockResolvedValue(null);
      mockCacheService.setCachedData.mockResolvedValue(undefined);

      // Mock NASA API
      mockNasaApiService.getEpicImages.mockResolvedValue(expectedResponse);

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(mockNasaApiService.getEpicImages).toHaveBeenCalledWith(
        '2019-05-30',
        'enhanced',
      );
    });

    it('should handle API errors gracefully', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const errorMessage = 'API Error';

      const cachePath = '/test/cache/2019-05-30_2019-05-30_natural.json';

      // Mock cache service
      mockCacheService.getCachePath.mockReturnValue(cachePath);
      mockCacheService.getCachedData.mockResolvedValue(null);

      // Mock NASA API error
      mockNasaApiService.getEpicImages.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(service.getEpicImages(query)).rejects.toThrow(errorMessage);
    });

    /*
    it('should handle cache write errors gracefully', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        data: expectedImages,
        status: 'success',
      };

      const cachePath = '/test/cache/2019-05-30_2019-05-30_natural.json';

      // Mock cache service
      mockCacheService.getCachePath.mockReturnValue(cachePath);
      mockCacheService.getCachedData.mockResolvedValue(null);
      mockCacheService.setCachedData.mockRejectedValue(new Error('Write failed'));

      // Mock NASA API
      mockNasaApiService.getEpicImages.mockResolvedValue(expectedResponse);

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(mockNasaApiService.getEpicImages).toHaveBeenCalledWith('2019-05-30', 'natural');
    });
    */
  });

  describe('getEpicImageByIdentifier', () => {
    it('should return cached image when available and valid', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const cachePath = '/test/cache/2019-05-30/images/20190530011359.png';

      // Mock cache service
      mockCacheService.getImageCachePath.mockReturnValue(cachePath);
      mockCacheService.ensureCacheDirectory.mockResolvedValue(undefined);
      mockCacheService.fileExists.mockResolvedValue(true);
      mockCacheService.validatePngFile.mockResolvedValue(true);

      const result = await service.getEpicImageByIdentifier(identifier, date);

      expect(result).toEqual(cachePath);
      expect(mockCacheService.fileExists).toHaveBeenCalledWith(cachePath);
      expect(mockCacheService.validatePngFile).toHaveBeenCalledWith(cachePath);
      expect(
        mockNasaApiService.saveEpicImageByIdentifier,
      ).not.toHaveBeenCalled();
    });

    /*
    it('should download image when not cached', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const cachePath = '/test/cache/2019-05-30/images/20190530011359.png';

      // Mock cache service
      mockCacheService.getImageCachePath.mockReturnValue(cachePath);
      mockCacheService.ensureCacheDirectory.mockResolvedValue(undefined);
      mockCacheService.fileExists.mockResolvedValue(false);
      mockCacheService.waitForFileStability.mockResolvedValue(undefined);
      mockCacheService.validatePngFile.mockResolvedValue(true);

      // Mock NASA API
      mockNasaApiService.saveEpicImageByIdentifier.mockResolvedValue(undefined);

      // Mock fs.stat for file size check
      const mockStats = { size: 1024 };
      jest.spyOn(require('fs').promises, 'stat').mockResolvedValue(mockStats);

      const result = await service.getEpicImageByIdentifier(identifier, date);

      expect(result).toEqual(cachePath);
      expect(mockNasaApiService.saveEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date, cachePath);
      expect(mockCacheService.waitForFileStability).toHaveBeenCalledWith(cachePath);
    });
    */

    it('should retry download when cached image is corrupted', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const cachePath = '/test/cache/2019-05-30/images/20190530011359.png';

      // Mock cache service
      mockCacheService.getImageCachePath.mockReturnValue(cachePath);
      mockCacheService.ensureCacheDirectory.mockResolvedValue(undefined);
      mockCacheService.fileExists.mockResolvedValue(true);
      mockCacheService.validatePngFile.mockResolvedValue(false);
      mockCacheService.removeCorruptedFile.mockResolvedValue(undefined);
      mockCacheService.waitForFileStability.mockResolvedValue(undefined);
      mockCacheService.fileExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);
      mockCacheService.validatePngFile
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      // Mock NASA API
      mockNasaApiService.saveEpicImageByIdentifier.mockResolvedValue(undefined);

      // Mock fs.stat for file size check
      const mockStats = { size: 1024 };
      jest.spyOn(require('fs').promises, 'stat').mockResolvedValue(mockStats);

      const result = await service.getEpicImageByIdentifier(identifier, date);

      expect(result).toEqual(cachePath);
      expect(mockCacheService.removeCorruptedFile).toHaveBeenCalledWith(
        cachePath,
      );
      expect(mockNasaApiService.saveEpicImageByIdentifier).toHaveBeenCalledWith(
        identifier,
        date,
        cachePath,
      );
    });

    it('should handle download errors gracefully', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const cachePath = '/test/cache/2019-05-30/images/20190530011359.png';

      // Mock cache service
      mockCacheService.getImageCachePath.mockReturnValue(cachePath);
      mockCacheService.ensureCacheDirectory.mockResolvedValue(undefined);
      mockCacheService.fileExists.mockResolvedValue(false);

      // Mock NASA API error
      mockNasaApiService.saveEpicImageByIdentifier.mockRejectedValue(
        new Error('Download failed'),
      );

      await expect(
        service.getEpicImageByIdentifier(identifier, date),
      ).rejects.toThrow('Download failed');
    });
  });
});
