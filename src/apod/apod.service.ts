import { Injectable, Logger } from '@nestjs/common';
import { NasaApiService, APODImage } from '../nasa-api/nasa-api.service';
import { QueryApodDto } from './dto/query-apod.dto';
import { CacheService } from './cache.service';

interface ApodServiceResponse {
  data: APODImage[];
  status: string;
  limit?: number;
  remaining?: number;
}

@Injectable()
export class ApodService {
  private readonly logger = new Logger(ApodService.name);

  constructor(
    private readonly nasaApiService: NasaApiService,
    private readonly cacheService: CacheService,
  ) {}

  async getApodImages(query: QueryApodDto): Promise<ApodServiceResponse> {
    const { start_date, end_date } = query;
    
    // Create cache key based on date range
    const cacheKey = this.generateCacheKey(start_date, end_date);
    const cachePath = this.cacheService.getCachePath(cacheKey, 'apod');

    // 1. Check if cache exists
    const images = await this.cacheService.getCachedData<APODImage[]>(cachePath);
    if (images && images.length > 0) {
      this.logger.log(`Returning cached APOD images for date range: ${start_date} to ${end_date}`);
      return {
        data: images,
        status: 'cached',
      };
    }

    // 2. Fetch from NASA API
    this.logger.log(`Fetching APOD images from NASA API for date range: ${start_date} to ${end_date}`);
    const result = await this.nasaApiService.getApodImages(start_date, end_date);

    // 3. Store in cache
    await this.cacheService.setCachedData(cachePath, result.data);

    return result;
  }

  private generateCacheKey(start_date?: string, end_date?: string): string {
    if (start_date && end_date) {
      return `${start_date}_to_${end_date}`;
    } else if (start_date) {
      return `from_${start_date}`;
    } else if (end_date) {
      return `until_${end_date}`;
    }
    return 'latest';
  }
}
