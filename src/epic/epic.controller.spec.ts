import { Test, TestingModule } from '@nestjs/testing';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';
import { QueryEpicDto } from './dto/query-epic.dto';

describe('EpicController', () => {
  let controller: EpicController;
  let service: EpicService;

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
    getEpicImages: jest.fn(),
    getLatestEpicImages: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<EpicController>(EpicController);
    service = module.get<EpicService>(EpicService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEpicImages', () => {
    it('should return EPIC images for a specific date', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const expectedResult = [mockEpicImage];

      mockEpicService.getEpicImages.mockResolvedValue(expectedResult);

      const result = await controller.getEpicImages(query);

      expect(result).toEqual(expectedResult);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
    });

    it('should return EPIC images with natural parameter', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: true };
      const expectedResult = [mockEpicImage];

      mockEpicService.getEpicImages.mockResolvedValue(expectedResult);

      const result = await controller.getEpicImages(query);

      expect(result).toEqual(expectedResult);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
    });

    it('should return EPIC images with enhanced parameter', async () => {
      const query: QueryEpicDto = { date: '2019-05-30', natural: false };
      const expectedResult = [mockEpicImage];

      mockEpicService.getEpicImages.mockResolvedValue(expectedResult);

      const result = await controller.getEpicImages(query);

      expect(result).toEqual(expectedResult);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
    });

    it('should return EPIC images without date parameter', async () => {
      const query: QueryEpicDto = {};
      const expectedResult = [mockEpicImage];

      mockEpicService.getEpicImages.mockResolvedValue(expectedResult);

      const result = await controller.getEpicImages(query);

      expect(result).toEqual(expectedResult);
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
    });

    it('should handle service errors', async () => {
      const query: QueryEpicDto = { date: '2019-05-30' };
      const errorMessage = 'Service error';

      mockEpicService.getEpicImages.mockRejectedValue(new Error(errorMessage));

      await expect(controller.getEpicImages(query)).rejects.toThrow(
        errorMessage,
      );
      expect(service.getEpicImages).toHaveBeenCalledWith(query);
    });
  });

  describe('getLatestEpicImages', () => {
    it('should return latest EPIC images', async () => {
      const expectedResult = [mockEpicImage];

      mockEpicService.getLatestEpicImages.mockResolvedValue(expectedResult);

      const result = await controller.getLatestEpicImages();

      expect(result).toEqual(expectedResult);
      expect(service.getLatestEpicImages).toHaveBeenCalled();
    });

    it('should handle service errors for latest images', async () => {
      const errorMessage = 'Service error';

      mockEpicService.getLatestEpicImages.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getLatestEpicImages()).rejects.toThrow(
        errorMessage,
      );
      expect(service.getLatestEpicImages).toHaveBeenCalled();
    });
  });

  describe('getEpicImageByIdentifier', () => {
    it('should return EPIC image by identifier', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const expectedResult = 'base64encodedimage';

      mockEpicService.getEpicImageByIdentifier.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getEpicImageByIdentifier(identifier, date);

      expect(result).toEqual(expectedResult);
      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
    });

    it('should handle service errors for identifier lookup', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const errorMessage = 'Service error';

      mockEpicService.getEpicImageByIdentifier.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.getEpicImageByIdentifier(identifier, date),
      ).rejects.toThrow(errorMessage);
      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
    });

    it('should handle not found identifier', async () => {
      const identifier = 'nonexistent';
      const date = '2019-05-30';
      const errorMessage = 'EPIC image with identifier nonexistent not found';

      mockEpicService.getEpicImageByIdentifier.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.getEpicImageByIdentifier(identifier, date),
      ).rejects.toThrow(errorMessage);
      expect(service.getEpicImageByIdentifier).toHaveBeenCalledWith(identifier, date);
    });
  });
});
