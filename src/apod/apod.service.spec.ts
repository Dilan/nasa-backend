import { Test, TestingModule } from '@nestjs/testing';
import { ApodService } from './apod.service';
import { NasaApiService } from '../nasa-api/nasa-api.service';
import { CacheService } from './cache.service';
import { APODImage } from '../nasa-api/nasa-api.service';

describe('ApodService', () => {
  let service: ApodService;
  let nasaApiService: NasaApiService;
  let cacheService: CacheService;

  const mockAPODImages: APODImage[] = [
    {
      copyright: 'Test Copyright',
      date: '2024-01-01',
      explanation: 'Test explanation',
      hdurl: 'https://example.com/hd.jpg',
      media_type: 'image',
      service_version: 'v1',
      title: 'Test Title',
      url: 'https://example.com/image.jpg',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApodService,
        {
          provide: NasaApiService,
          useValue: {
            getApodImages: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            getCachedData: jest.fn(),
            setCachedData: jest.fn(),
            getCachePath: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApodService>(ApodService);
    nasaApiService = module.get<NasaApiService>(NasaApiService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getApodImages', () => {
    it('should return cached data when available', async () => {
      const query = { start_date: '2024-01-01', end_date: '2024-01-02' };
      const cachePath = '.cache/apod/2024-01-01_to_2024-01-02/2024-01-01_to_2024-01-02_apod.json';

      jest.spyOn(cacheService, 'getCachePath').mockReturnValue(cachePath);
      jest.spyOn(cacheService, 'getCachedData').mockResolvedValue(mockAPODImages);

      const result = await service.getApodImages(query);

      expect(result.data).toEqual(mockAPODImages);
      expect(result.status).toBe('cached');
      expect(cacheService.getCachedData).toHaveBeenCalledWith(cachePath);
    });

    it('should fetch from NASA API when cache is not available', async () => {
      const query = { start_date: '2024-01-01', end_date: '2024-01-02' };
      const cachePath = '.cache/apod/2024-01-01_to_2024-01-02/2024-01-01_to_2024-01-02_apod.json';

      jest.spyOn(cacheService, 'getCachePath').mockReturnValue(cachePath);
      jest.spyOn(cacheService, 'getCachedData').mockResolvedValue(null);
      jest.spyOn(nasaApiService, 'getApodImages').mockResolvedValue({
        data: mockAPODImages,
        status: 'success',
        limit: 1000,
        remaining: 999,
      });
      jest.spyOn(cacheService, 'setCachedData').mockResolvedValue();

      const result = await service.getApodImages(query);

      expect(result.data).toEqual(mockAPODImages);
      expect(result.status).toBe('success');
      expect(nasaApiService.getApodImages).toHaveBeenCalledWith('2024-01-01', '2024-01-02');
      expect(cacheService.setCachedData).toHaveBeenCalledWith(cachePath, mockAPODImages);
    });

    it('should handle single date queries correctly', async () => {
      const query = { start_date: '2024-01-01' };
      const cachePath = '.cache/apod/from_2024-01-01/from_2024-01-01_apod.json';

      jest.spyOn(cacheService, 'getCachePath').mockReturnValue(cachePath);
      jest.spyOn(cacheService, 'getCachedData').mockResolvedValue(null);
      jest.spyOn(nasaApiService, 'getApodImages').mockResolvedValue({
        data: mockAPODImages,
        status: 'success',
        limit: 1000,
        remaining: 999,
      });
      jest.spyOn(cacheService, 'setCachedData').mockResolvedValue();

      const result = await service.getApodImages(query);

      expect(result.data).toEqual(mockAPODImages);
      expect(nasaApiService.getApodImages).toHaveBeenCalledWith('2024-01-01', undefined);
    });
  });
});
