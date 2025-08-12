import { Injectable, Logger } from '@nestjs/common';
import {
  NasaApiService,
  EpicImage,
  EpicType,
} from '../nasa-api/nasa-api.service';
import { QueryEpicDto } from './dto/query-epic.dto';
import { CacheService } from './cache.service';
import * as path from 'path';
import { promises as fs } from 'fs';

interface EpicServiceResponse {
  data: EpicImage[];
  status: string;
  limit?: number;
  remaining?: number;
}

@Injectable()
export class EpicService {
  private readonly logger = new Logger(EpicService.name);

  constructor(
    private readonly nasaApiService: NasaApiService,
    private readonly cacheService: CacheService,
  ) {}

  async getAvailableDates(
    type: EpicType = 'natural',
  ): Promise<EpicServiceResponse> {
    return await this.nasaApiService.getAvailableDates(type);
  }

  async getEpicImages(query: QueryEpicDto): Promise<EpicServiceResponse> {
    const date = query.date;
    const type: EpicType = query.natural ? 'natural' : 'enhanced';
    const cachePath = this.cacheService.getCachePath(date, type);

    // 1. Check if cache exists
    const images =
      await this.cacheService.getCachedData<EpicImage[]>(cachePath);
    if (images && images.length > 0) {
      return {
        data: images,
        status: 'cached',
      };
    }

    // 2. Fetch from NASA API
    const result = await this.nasaApiService.getEpicImages(date, type);

    // 3. Store in cache
    await this.cacheService.setCachedData(cachePath, result.data);

    return result;
  }

  // return PNG image
  async getEpicImageByIdentifier(
    image_identifier: string,
    date: string,
  ): Promise<string> {
    const cachePath = this.cacheService.getImageCachePath(image_identifier);

    // Ensure cache directory exists
    await this.cacheService.ensureCacheDirectory(path.dirname(cachePath));

    if (await this.cacheService.fileExists(cachePath)) {
      // Validate cached file
      if (await this.cacheService.validatePngFile(cachePath)) {
        this.logger.log(
          `Returning cached EPIC image for identifier: ${image_identifier}, date: ${date}`,
        );
        return cachePath;
      } else {
        this.logger.warn(
          `Cached file is corrupted, will retry download: ${image_identifier}`,
        );
        return this.cleanupAndRetry(image_identifier, date, cachePath);
      }
    } else {
      this.logger.log(
        `Downloading EPIC image for identifier: ${image_identifier}, date: ${date}`,
      );
      await this.nasaApiService.saveEpicImageByIdentifier(
        image_identifier,
        date,
        cachePath,
      );

      // Wait for file stability to ensure download is complete
      await this.cacheService.waitForFileStability(cachePath);

      // Verify the file was created and has content
      if (await this.cacheService.fileExists(cachePath)) {
        const stats = await fs.stat(cachePath);
        if (stats.size > 0) {
          // Validate that it's actually a PNG file
          if (await this.cacheService.validatePngFile(cachePath)) {
            this.logger.log(
              `Successfully downloaded EPIC image: ${image_identifier}, size: ${stats.size} bytes`,
            );
            return cachePath;
          } else {
            this.logger.warn(
              `Downloaded file is not a valid PNG, will retry: ${image_identifier}`,
            );
            return this.cleanupAndRetry(image_identifier, date, cachePath);
          }
        } else {
          throw new Error(
            `Downloaded image file is empty: ${image_identifier}`,
          );
        }
      } else {
        throw new Error(`Failed to create image file: ${image_identifier}`);
      }
    }
  }

  private async cleanupAndRetry(
    image_identifier: string,
    date: string,
    cachePath: string,
  ): Promise<string> {
    try {
      // Remove corrupted file
      await this.cacheService.removeCorruptedFile(cachePath);

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Retry download
      this.logger.log(
        `Retrying download for corrupted file: ${image_identifier}, date: ${date}`,
      );
      await this.nasaApiService.saveEpicImageByIdentifier(
        image_identifier,
        date,
        cachePath,
      );

      // Wait for file stability
      await this.cacheService.waitForFileStability(cachePath);

      // Validate again
      if (await this.cacheService.fileExists(cachePath)) {
        const stats = await fs.stat(cachePath);
        if (
          stats.size > 0 &&
          (await this.cacheService.validatePngFile(cachePath))
        ) {
          this.logger.log(
            `Successfully downloaded EPIC image on retry: ${image_identifier}, size: ${stats.size} bytes`,
          );
          return cachePath;
        }
      }

      throw new Error(
        `Failed to download valid image after cleanup and retry: ${image_identifier}`,
      );
    } catch (error) {
      this.logger.error(
        `Cleanup and retry failed for ${image_identifier}:`,
        error.message,
      );
      throw error;
    }
  }
}
