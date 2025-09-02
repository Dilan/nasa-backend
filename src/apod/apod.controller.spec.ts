import { Test, TestingModule } from '@nestjs/testing';
import { ApodController } from './apod.controller';
import { ApodService } from './apod.service';
import { APODImage } from '../nasa-api/nasa-api.service';

describe('ApodController', () => {
  let controller: ApodController;
  let service: ApodService;

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
      controllers: [ApodController],
      providers: [
        {
          provide: ApodService,
          useValue: {
            getApodImages: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ApodController>(ApodController);
    service = module.get<ApodService>(ApodService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getApodImages', () => {
    it('should return APOD images with rate limit headers', async () => {
      const query = { start_date: '2024-01-01', end_date: '2024-01-02' };
      const mockResponse = {
        data: mockAPODImages,
        status: 'success',
        remaining: 999,
        limit: 1000,
      };

      jest.spyOn(service, 'getApodImages').mockResolvedValue(mockResponse);

      const mockRes = {
        setHeader: jest.fn(),
      } as any;

      const result = await controller.getApodImages(query, mockRes);

      expect(result).toEqual(mockAPODImages);
      expect(service.getApodImages).toHaveBeenCalledWith(query);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-ratelimit-remaining', 999);
      expect(mockRes.setHeader).toHaveBeenCalledWith('x-ratelimit-limit', 1000);
    });

    it('should return APOD images without rate limit headers when not available', async () => {
      const query = { start_date: '2024-01-01' };
      const mockResponse = {
        data: mockAPODImages,
        status: 'success',
      };

      jest.spyOn(service, 'getApodImages').mockResolvedValue(mockResponse);

      const mockRes = {
        setHeader: jest.fn(),
      } as any;

      const result = await controller.getApodImages(query, mockRes);

      expect(result).toEqual(mockAPODImages);
      expect(service.getApodImages).toHaveBeenCalledWith(query);
      expect(mockRes.setHeader).not.toHaveBeenCalled();
    });
  });
});
