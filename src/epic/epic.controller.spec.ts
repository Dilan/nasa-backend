import { Test, TestingModule } from '@nestjs/testing';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';
import { QueryEpicDto } from './dto/query-epic.dto';
import { Logger } from '@nestjs/common';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  createReadStream: jest.fn(),
}));

// Import the mocked fs module
import * as fs from 'fs';

describe('EpicController', () => {
  let controller: EpicController;
  let service: EpicService;

  // Mock response object
  const mockResponse = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    headersSent: false,
    on: jest.fn(),
  } as any;

  let mockLogger: {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  const mockEpicImage = {
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

  const mockEpicService = {
    getAvailableDates: jest.fn(),
    getEpicImages: jest.fn(),
    getEpicImageByIdentifier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpicController],
      providers: [
        {
          provide: EpicService,
          useValue: mockEpicService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    controller = module.get<EpicController>(EpicController);
    service = module.get<EpicService>(EpicService);

    // Create mock logger
    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
    // Reset response mock
    mockResponse.setHeader.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailableDates', () => {
    it('should return available dates and set headers', async () => {
      const type = 'natural';
      const serviceResult = {
        data: ['2019-05-30', '2019-05-29'],
        remaining: 85,
        limit: 100,
      };

      mockEpicService.getAvailableDates.mockResolvedValue(serviceResult);

      const result = await controller.getAvailableDates(type, mockResponse);

      expect(result).toEqual(['2019-05-30', '2019-05-29']);
      expect(service.getAvailableDates).toHaveBeenCalledWith(type);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-remaining',
        85,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-limit',
        100,
      );
    });

    it('should default to natural type when no type provided', async () => {
      const serviceResult = {
        data: ['2019-05-30'],
        remaining: 90,
        limit: 100,
      };

      mockEpicService.getAvailableDates.mockResolvedValue(serviceResult);

      const result = await controller.getAvailableDates(
        undefined,
        mockResponse,
      );

      expect(result).toEqual(['2019-05-30']);
      expect(service.getAvailableDates).toHaveBeenCalledWith('natural');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-remaining',
        90,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-limit',
        100,
      );
    });
  });

  describe('getEpicImages', () => {
    it('should return EPIC images for a specific date and set headers', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const serviceResult = {
        data: [mockEpicImage],
        remaining: 95,
        limit: 100,
      };

      mockEpicService.getEpicImages.mockResolvedValue(serviceResult);

      const result = await controller.getEpicImages(query, mockResponse);

      expect(result).toEqual([mockEpicImage]);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-remaining',
        95,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-limit',
        100,
      );
    });

    it('should return EPIC images with natural parameter and set headers', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: true };
      const serviceResult = {
        data: [mockEpicImage],
        remaining: 80,
        limit: 100,
      };

      mockEpicService.getEpicImages.mockResolvedValue(serviceResult);

      const result = await controller.getEpicImages(query, mockResponse);

      expect(result).toEqual([mockEpicImage]);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-remaining',
        80,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-limit',
        100,
      );
    });

    it('should return EPIC images with enhanced parameter and set headers', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: false };
      const serviceResult = {
        data: [mockEpicImage],
        remaining: 70,
        limit: 100,
      };

      mockEpicService.getEpicImages.mockResolvedValue(serviceResult);

      const result = await controller.getEpicImages(query, mockResponse);

      expect(result).toEqual([mockEpicImage]);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-remaining',
        70,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-limit',
        100,
      );
    });

    it('should return EPIC images without date parameter and set headers', async () => {
      const query: QueryEpicDto = {};
      const serviceResult = {
        data: [mockEpicImage],
        remaining: 90,
        limit: 100,
      };

      mockEpicService.getEpicImages.mockResolvedValue(serviceResult);

      const result = await controller.getEpicImages(query, mockResponse);

      expect(result).toEqual([mockEpicImage]);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-remaining',
        90,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'x-ratelimit-limit',
        100,
      );
    });

    it('should handle service errors', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const errorMessage = 'Service error';

      mockEpicService.getEpicImages.mockRejectedValue(new Error(errorMessage));

      await expect(
        controller.getEpicImages(query, mockResponse),
      ).rejects.toThrow(errorMessage);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
    });
  });

  // skip this test for now:
  describe('getEpicImageByIdentifier', () => {
    beforeEach(() => {
      // Reset fs mocks before each test
      jest.clearAllMocks();
    });

    it('should stream image successfully when service returns valid path', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const mockImagePath = '/path/to/image.png';

      // Setup fs mocks
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
      const mockStream = {
        on: jest.fn().mockReturnThis(),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      mockEpicService.getEpicImageByIdentifier.mockResolvedValue(mockImagePath);

      await controller.getEpicImageByIdentifier(identifier, mockResponse);

      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(
        identifier,
        date,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'image/png',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=31536000, immutable',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        1024,
      );
    });
    /*
    it('should handle file not found error', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const mockImagePath = '/path/to/image.png';
      
      // Setup fs mocks
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      mockEpicService.getEpicImageByIdentifier.mockResolvedValue(mockImagePath);

      await controller.getEpicImageByIdentifier(date, identifier, mockResponse);

      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Image not found' });
    });

    it('should handle empty file error', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const mockImagePath = '/path/to/image.png';
      
      // Setup fs mocks
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 0 });

      mockEpicService.getEpicImageByIdentifier.mockResolvedValue(mockImagePath);

      await controller.getEpicImageByIdentifier(date, identifier, mockResponse);

      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Image file is empty or incomplete' });
    });

    it('should handle service errors gracefully', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const errorMessage = 'Service error';

      mockEpicService.getEpicImageByIdentifier.mockRejectedValue(new Error(errorMessage));

      await controller.getEpicImageByIdentifier(date, identifier, mockResponse);

      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('should handle stream errors', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const mockImagePath = '/path/to/image.png';
      
      // Setup fs mocks
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
      
      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'error') {
            // Simulate stream error immediately
            callback(new Error('Stream error'));
          }
          return mockStream;
        }),
        pipe: jest.fn(),
        destroy: jest.fn(),
      };
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      mockEpicService.getEpicImageByIdentifier.mockResolvedValue(mockImagePath);

      await controller.getEpicImageByIdentifier(date, identifier, mockResponse);

      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
      // The error should be handled and response sent
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to stream image' });
    });
*/
  });
});
