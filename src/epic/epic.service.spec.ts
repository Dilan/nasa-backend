import { Test, TestingModule } from '@nestjs/testing';
import { EpicService } from './epic.service';
import { NasaApiService, EpicImage } from '../nasa-api/nasa-api.service';
import { QueryEpicDto } from './dto/query-epic.dto';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('EpicService', () => {
  let service: EpicService;
  let nasaApiService: NasaApiService;
  let fsPromises: any;
  let pathModule: any;

  const mockEpicImage: EpicImage = {
    identifier: '20190530011359',
    caption:
      "This image was taken by NASA's EPIC camera onboard the NOAA DSCOVR spacecraft",
    image: 'epic_1b_20190530011359',
    version: '03',
    centroid_coordinates: {
      lat: 24.56543,
      lon: 170.683594,
    },
    dscovr_j2000_position: {
      x: 339005.145834,
      y: 1368757.776568,
      z: 645861.927788,
    },
    lunar_j2000_position: {
      x: 381104.35964,
      y: 104675.95663,
      z: -35701.90868,
    },
    sun_j2000_position: {
      x: 56531896.481815,
      y: 129098775.627199,
      z: 55963516.666649,
    },
    attitude_quaternions: {
      q0: 0.495585,
      q1: -0.356553,
      q2: -0.694341,
      q3: 0.380992,
    },
    date: '2019-05-30 01:09:10',
    coords: {
      centroid_coordinates: {
        lat: 24.56543,
        lon: 170.683594,
      },
      dscovr_j2000_position: {
        x: 339005.145834,
        y: 1368757.776568,
        z: 645861.927788,
      },
      lunar_j2000_position: {
        x: 381104.35964,
        y: 104675.95663,
        z: -35701.90868,
      },
      sun_j2000_position: {
        x: 56531896.481815,
        y: 129098775.627199,
        z: 55963516.666649,
      },
      attitude_quaternions: {
        q0: 0.495585,
        q1: -0.356553,
        q2: -0.694341,
        q3: 0.380992,
      },
    },
  };

  const mockNasaApiService = {
    getEpicImages: jest.fn(),
    getEpicImageByIdentifier: jest.fn(),
    getLatestEpicImages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpicService,
        {
          provide: NasaApiService,
          useValue: mockNasaApiService,
        },
      ],
    }).compile();

    service = module.get<EpicService>(EpicService);
    nasaApiService = module.get<NasaApiService>(NasaApiService);
    fsPromises = require('fs/promises');
    pathModule = require('path');

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEpicImages', () => {
    it('should get EPIC images from cache when available', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: true };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        items: expectedImages,
        status: 'success (cached)',
      };

      // Mock cache hit
      fsPromises.readFile.mockResolvedValue(JSON.stringify(expectedImages));

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(fsPromises.readFile).toHaveBeenCalled();
      expect(mockNasaApiService.getEpicImages).not.toHaveBeenCalled();
    });

    it('should get EPIC images from NASA API when cache miss and cache the response', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: true };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        items: expectedImages,
        status: 'success',
      };

      // Mock cache miss
      fsPromises.readFile.mockRejectedValue(new Error('File not found'));
      mockNasaApiService.getEpicImages.mockResolvedValue(expectedImages);
      fsPromises.mkdir.mockResolvedValue(undefined);
      fsPromises.writeFile.mockResolvedValue(undefined);

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(fsPromises.readFile).toHaveBeenCalled();
      expect(mockNasaApiService.getEpicImages).toHaveBeenCalledWith('2019-05-30', true);
      expect(fsPromises.mkdir).toHaveBeenCalled();
      expect(fsPromises.writeFile).toHaveBeenCalled();
    });

    it('should get EPIC images with enhanced parameter', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: false };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        items: expectedImages,
        status: 'success',
      };

      // Mock cache miss
      fsPromises.readFile.mockRejectedValue(new Error('File not found'));
      mockNasaApiService.getEpicImages.mockResolvedValue(expectedImages);
      fsPromises.mkdir.mockResolvedValue(undefined);
      fsPromises.writeFile.mockResolvedValue(undefined);

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(mockNasaApiService.getEpicImages).toHaveBeenCalledWith('2019-05-30', false);
    });

    it('should handle API errors gracefully', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const errorMessage = 'API Error';

      // Mock cache miss
      fsPromises.readFile.mockRejectedValue(new Error('File not found'));
      mockNasaApiService.getEpicImages.mockRejectedValue(new Error(errorMessage));

      await expect(service.getEpicImages(query)).rejects.toThrow(errorMessage);
    });

    it('should handle cache write errors gracefully', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const expectedImages = [mockEpicImage];
      const expectedResponse = {
        items: expectedImages,
        status: 'success',
      };

      // Mock cache miss
      fsPromises.readFile.mockRejectedValue(new Error('File not found'));
      mockNasaApiService.getEpicImages.mockResolvedValue(expectedImages);
      fsPromises.mkdir.mockResolvedValue(undefined);
      fsPromises.writeFile.mockRejectedValue(new Error('Write failed'));

      const result = await service.getEpicImages(query);

      expect(result).toEqual(expectedResponse);
      expect(mockNasaApiService.getEpicImages).toHaveBeenCalledWith('2019-05-30', true);
    });
  });

  describe('getEpicImageByIdentifier', () => {
    it('should get EPIC image by identifier', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const expectedBase64 = 'base64encodedimage';

      mockNasaApiService.getEpicImageByIdentifier.mockResolvedValue(expectedBase64);

      const result = await service.getEpicImageByIdentifier(identifier, date);

      expect(result).toEqual(expectedBase64);
      expect(mockNasaApiService.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
    });

    it('should handle API errors when fetching by identifier', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const errorMessage = 'API Error';

      mockNasaApiService.getEpicImageByIdentifier.mockRejectedValue(new Error(errorMessage));

      await expect(
        service.getEpicImageByIdentifier(identifier, date),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getLatestEpicImages', () => {
    it('should get latest EPIC images', async () => {
      const expectedImages = [mockEpicImage];

      mockNasaApiService.getLatestEpicImages.mockResolvedValue(expectedImages);

      const result = await service.getLatestEpicImages();

      expect(result).toEqual(expectedImages);
      expect(mockNasaApiService.getLatestEpicImages).toHaveBeenCalled();
    });

    it('should handle API errors when fetching latest images', async () => {
      const errorMessage = 'API Error';

      mockNasaApiService.getLatestEpicImages.mockRejectedValue(new Error(errorMessage));

      await expect(service.getLatestEpicImages()).rejects.toThrow(errorMessage);
    });
  });
});
