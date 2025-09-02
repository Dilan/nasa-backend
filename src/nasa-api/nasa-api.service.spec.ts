import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NasaApiService, EpicImage } from './nasa-api.service';
import { NasaError } from '../common/errors';

describe('NasaApiService', () => {
  let service: NasaApiService;
  let configService: ConfigService;
  let mockLogger: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  const mockEpicImage: EpicImage = {
    identifier: '20190530011359',
    caption:
      "This image was taken by NASA's EPIC camera onboard the NOAA DSCOVR spacecraft",
    image: 'epic_1b_20190530011359',
    version: '03',
    date: '2019-05-30 01:09:10',
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Create mock logger instance
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Set default mock values
    mockConfigService.get.mockReturnValue('DEMO_KEY');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NasaApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .setLogger(mockLogger)
      .compile();

    service = module.get<NasaApiService>(NasaApiService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();

    // Mock axios
    jest.spyOn(axios, 'get').mockResolvedValue({ data: [mockEpicImage] });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEpicImages', () => {
    it('should fetch EPIC images for a specific date', async () => {
      const date = '2019-05-30';
      const expectedImages = [mockEpicImage];

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: expectedImages,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      });

      const result = await service.getEpicImages(date, 'natural');

      expect(result).toEqual({
        data: expectedImages,
        status: 'success',
        limit: 100,
        remaining: 95,
      });
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/date/2019-05-30',
        { params: { api_key: 'DEMO_KEY' } },
      );

      // Verify logger calls
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Fetching EPIC images for date: ${date}, type: natural`,
        'NasaApiService',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Remaining requests: 95 out of 100',
        'NasaApiService',
      );
      expect(mockLogger.log).toHaveBeenCalledWith(
        'Retrieved 1 EPIC images',
        'NasaApiService',
      );
    });

    it('should fetch enhanced EPIC images when natural is false', async () => {
      const date = '2019-05-30';
      const expectedImages = [mockEpicImage];

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: expectedImages,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      });

      const result = await service.getEpicImages(date, 'enhanced');

      expect(result).toEqual({
        data: expectedImages,
        status: 'success',
        limit: 100,
        remaining: 95,
      });
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/enhanced/date/2019-05-30',
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should remove date when no date is provided', async () => {
      const expectedImages = [mockEpicImage];

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({
        data: expectedImages,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      });

      const result = await service.getEpicImages(undefined, 'natural');

      expect(result).toEqual({
        data: expectedImages,
        status: 'success',
        limit: 100,
        remaining: 95,
      });
      expect(axios.get).toHaveBeenCalledWith(
        `https://api.nasa.gov/EPIC/api/natural`,
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should handle API errors gracefully', async () => {
      const date = '2019-05-30';
      const errorMessage = 'Unexpected error occurred while contacting NASA API';

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockRejectedValue(new Error(errorMessage));

      await expect(service.getEpicImages(date, 'natural')).rejects.toThrow(
        errorMessage,
      );
    });

    it('should use custom API key from config', async () => {
      const date = '2019-05-30';
      const expectedImages = [mockEpicImage];

      // Create a new module with custom API key
      mockConfigService.get.mockReturnValue('CUSTOM_API_KEY');
      
      const customModule: TestingModule = await Test.createTestingModule({
        providers: [
          NasaApiService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      })
        .setLogger(mockLogger)
        .compile();

      const customService = customModule.get<NasaApiService>(NasaApiService);

      jest.spyOn(axios, 'get').mockResolvedValue({
        data: expectedImages,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      });

      await customService.getEpicImages(date, 'natural');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/date/2019-05-30',
        { params: { api_key: 'CUSTOM_API_KEY' } },
      );
    });
  });

  describe('saveEpicImageByIdentifier', () => {
    it('should save EPIC image by identifier', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const savePath = '/tmp/test-image.png';

      // Mock the stream with proper event emitters
      const mockStream = {
        pipe: jest.fn().mockReturnValue({}),
        on: jest.fn().mockReturnThis(),
      };
      const mockResponse = { data: mockStream };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      // Mock fs module
      const mockWriteStream = {
        on: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };

      // Mock fs.createWriteStream to return our mock write stream
      const fs = require('fs');
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      // Mock the stream events to resolve the promise
      mockWriteStream.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          // Simulate successful write completion
          setTimeout(() => callback(), 0);
        }
        return mockWriteStream;
      });

      const result = await service.saveEpicImageByIdentifier(
        identifier,
        date,
        savePath,
      );

      expect(result).toBe(savePath);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/archive/natural/2019/05/30/png/20190530011359.png',
        {
          params: { api_key: 'DEMO_KEY' },
          responseType: 'stream',
          timeout: 30000,
          maxContentLength: 50 * 1024 * 1024,
        },
      );
    });

    it('should handle stream errors and log them', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const savePath = '/tmp/test-image.png';

      const mockStream = {
        pipe: jest.fn().mockReturnValue({}),
        on: jest.fn().mockReturnThis(),
      };
      const mockResponse = { data: mockStream };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const mockWriteStream = {
        on: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };

      const fs = require('fs');
      jest.spyOn(fs, 'createWriteStream').mockReturnValue(mockWriteStream);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      // Mock stream error
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Stream error')), 0);
        }
        return mockStream;
      });

      await expect(
        service.saveEpicImageByIdentifier(identifier, date, savePath),
      ).rejects.toThrow('Stream error');

      // Verify error logger call
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Stream error for ${identifier}:`,
        'Stream error',
        'NasaApiService',
      );
    });
  });

  describe('getAvailableDates', () => {
    it('should fetch available dates for natural type by default', async () => {
      const mockDates = ['2019-05-30', '2019-05-29', '2019-05-28'];
      const mockResponse = {
        data: mockDates,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const result = await service.getAvailableDates();

      expect(result).toEqual({
        data: mockDates,
        status: 'success',
        limit: 100,
        remaining: 95,
      });
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/available',
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should fetch available dates for enhanced type when specified', async () => {
      const mockDates = ['2019-05-30', '2019-05-29', '2019-05-28'];
      const mockResponse = {
        data: mockDates,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const result = await service.getAvailableDates('enhanced');

      expect(result).toEqual({
        data: mockDates,
        status: 'success',
        limit: 100,
        remaining: 95,
      });
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/enhanced/available',
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should handle rate limit headers correctly', async () => {
      const mockDates = ['2019-05-30'];
      const mockResponse = {
        data: mockDates,
        headers: {
          'x-ratelimit-remaining': '50',
          'x-ratelimit-limit': '1000',
        },
      };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const result = await service.getAvailableDates('natural');

      expect(result.limit).toBe(1000);
      expect(result.remaining).toBe(50);
      expect(result.status).toBe('success');
    });

    it('should handle missing rate limit headers gracefully', async () => {
      const mockDates = ['2019-05-30'];
      const mockResponse = {
        data: mockDates,
        headers: {},
      };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const result = await service.getAvailableDates('natural');

      expect(result.limit).toBeNaN();
      expect(result.remaining).toBeNaN();
      expect(result.status).toBe('success');
      expect(result.data).toEqual(mockDates);
    });

    it('should use custom API key from config', async () => {
      const mockDates = ['2019-05-30'];
      const mockResponse = {
        data: mockDates,
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      };

      // Create a new module with custom API key
      mockConfigService.get.mockReturnValue('CUSTOM_API_KEY');
      
      const customModule: TestingModule = await Test.createTestingModule({
        providers: [
          NasaApiService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      })
        .setLogger(mockLogger)
        .compile();

      const customService = customModule.get<NasaApiService>(NasaApiService);

      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      await customService.getAvailableDates('natural');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/available',
        { params: { api_key: 'CUSTOM_API_KEY' } },
      );
    });

    it('should handle API errors gracefully and throw NasaError', async () => {
      const errorMessage = 'upstream connect error or disconnect/reset';

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockRejectedValue(new Error(errorMessage));

      // Option 1: Using try/catch
      try {
        await service.getAvailableDates('natural');
        fail('Expected function to throw');
      } catch (error) {
        expect(error).toBeInstanceOf(NasaError);
        expect(error.code).toBe(500);
        expect(error.msg).toBe('Unexpected error occurred while contacting NASA API.');
      }
    });

    it('should handle empty response data', async () => {
      const mockResponse = {
        data: [],
        headers: {
          'x-ratelimit-remaining': '95',
          'x-ratelimit-limit': '100',
        },
      };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const result = await service.getAvailableDates('natural');

      expect(result.data).toEqual([]);
      expect(result.status).toBe('success');
    });
  });
});
