import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NasaApiService, EpicImage } from './nasa-api.service';

describe('NasaApiService', () => {
  let service: NasaApiService;
  let configService: ConfigService;

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

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
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
    }).compile();

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
      const natural = true;
      const expectedImages = [mockEpicImage];

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({ data: expectedImages });

      const result = await service.getEpicImages(date, natural);

      expect(result).toEqual(expectedImages);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/date/2019-05-30',
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should fetch enhanced EPIC images when natural is false', async () => {
      const date = '2019-05-30';
      const natural = false;
      const expectedImages = [mockEpicImage];

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({ data: expectedImages });

      const result = await service.getEpicImages(date, natural);

      expect(result).toEqual(expectedImages);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/enhanced/date/2019-05-30',
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should use default date when no date is provided', async () => {
      const natural = true;
      const expectedImages = [mockEpicImage];
      const today = new Date();
      const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({ data: expectedImages });

      const result = await service.getEpicImages(undefined, natural);

      expect(result).toEqual(expectedImages);
      expect(axios.get).toHaveBeenCalledWith(
        `https://api.nasa.gov/EPIC/api/natural/date/${expectedDate}`,
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should handle API errors gracefully', async () => {
      const date = '2019-05-30';
      const natural = true;
      const errorMessage = 'API Error';

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockRejectedValue(new Error(errorMessage));

      await expect(service.getEpicImages(date, natural)).rejects.toThrow(errorMessage);
    });

    it('should use custom API key from config', async () => {
      const date = '2019-05-30';
      const natural = true;
      const expectedImages = [mockEpicImage];

      // Create a new service instance with custom API key
      mockConfigService.get.mockReturnValue('CUSTOM_API_KEY');
      const customService = new NasaApiService(configService);

      jest.spyOn(axios, 'get').mockResolvedValue({ data: expectedImages });

      await customService.getEpicImages(date, natural);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/date/2019-05-30',
        { params: { api_key: 'CUSTOM_API_KEY' } },
      );
    });
  });

  describe('getEpicImageByIdentifier', () => {
    it('should fetch EPIC image by identifier', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const mockResponse = { data: Buffer.from('fake-image-data') };

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue(mockResponse);

      const result = await service.getEpicImageByIdentifier(identifier, date);

      expect(typeof result).toBe('string');
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/archive/natural/2019/05/30/png/20190530011359',
        { params: { api_key: 'DEMO_KEY' }, responseType: 'arraybuffer' },
      );
    });

    it('should handle API errors when fetching by identifier', async () => {
      const identifier = '20190530011359';
      const date = '2019-05-30';
      const errorMessage = 'API Error';

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockRejectedValue(new Error(errorMessage));

      await expect(
        service.getEpicImageByIdentifier(identifier, date),
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('getLatestEpicImages', () => {
    it('should fetch latest EPIC images', async () => {
      const expectedImages = [mockEpicImage];

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockResolvedValue({ data: expectedImages });

      const result = await service.getLatestEpicImages();

      expect(result).toEqual(expectedImages);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/EPIC/api/natural/latest',
        { params: { api_key: 'DEMO_KEY' } },
      );
    });

    it('should handle API errors when fetching latest images', async () => {
      const errorMessage = 'API Error';

      mockConfigService.get.mockReturnValue('DEMO_KEY');
      jest.spyOn(axios, 'get').mockRejectedValue(new Error(errorMessage));

      await expect(service.getLatestEpicImages()).rejects.toThrow(errorMessage);
    });
  });
}); 