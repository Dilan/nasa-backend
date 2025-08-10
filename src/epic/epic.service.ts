import { Injectable, Logger } from '@nestjs/common';
import { NasaApiService, EpicImage } from '../nasa-api/nasa-api.service';
import { QueryEpicDto } from './dto/query-epic.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

interface EpicImagesResponse {
  items: EpicImage[];
  status: string;
  limit: number;
  remaining: number;
}

@Injectable()
export class EpicService {
  private readonly logger = new Logger(EpicService.name);
  private readonly cacheDir = 'cache/epic';

  constructor(private readonly nasaApiService: NasaApiService) {}

  async getEpicImages(query: QueryEpicDto): Promise<EpicImagesResponse> {
    return await this.getEpicImagesFromCacheOrNasaApi(query);
  }

  private async validatePngFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      // Check PNG magic number (first 8 bytes)
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      return buffer.subarray(0, 8).equals(pngSignature);
    } catch {
      return false;
    }
  }

  private async cleanupAndRetry(image_identifier: string, date: string, cachePath: string): Promise<string> {
    try {
      // Remove corrupted file
      if (await this.fileExistsAsync(cachePath)) {
        await fs.unlink(cachePath);
        this.logger.warn(`Removed corrupted file: ${cachePath}`);
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry download
      this.logger.log(`Retrying download for corrupted file: ${image_identifier}`);
      await this.nasaApiService.saveEpicImageByIdentifier(image_identifier, date, cachePath);
      
      // Wait for file stability
      await this.waitForFileStability(cachePath);
      
      // Validate again
      if (await this.fileExistsAsync(cachePath)) {
        const stats = await fs.stat(cachePath);
        if (stats.size > 0 && await this.validatePngFile(cachePath)) {
          this.logger.log(`Successfully downloaded EPIC image on retry: ${image_identifier}, size: ${stats.size} bytes`);
          return cachePath;
        }
      }
      
      throw new Error(`Failed to download valid image after cleanup and retry: ${image_identifier}`);
    } catch (error) {
      this.logger.error(`Cleanup and retry failed for ${image_identifier}:`, error.message);
      throw error;
    }
  }

  // return PNG image 
  async getEpicImageByIdentifier(image_identifier: string, date: string): Promise<string> {

    // create cache directory if it doesn't exist
    await fs.mkdir(path.join(this.cacheDir, date, 'images'), { recursive: true });

    const cachePath = path.join(this.cacheDir, date, 'images', `${image_identifier}.png`);

    if (await this.fileExistsAsync(cachePath)) {
      // Validate cached file
      if (await this.validatePngFile(cachePath)) {
        this.logger.log(`Returning cached EPIC image for identifier: ${image_identifier}, date: ${date}`);
        return cachePath;
      } else {
        this.logger.warn(`Cached file is corrupted, will retry download: ${image_identifier}`);
        return this.cleanupAndRetry(image_identifier, date, cachePath);
      }
    } else {
      this.logger.log(`Downloading EPIC image for identifier: ${image_identifier}, date: ${date}`);
      await this.nasaApiService.saveEpicImageByIdentifier(image_identifier, date, cachePath);
      
      // Wait for file stability to ensure download is complete
      await this.waitForFileStability(cachePath);
      
      // Verify the file was created and has content
      if (await this.fileExistsAsync(cachePath)) {
        const stats = await fs.stat(cachePath);
        if (stats.size > 0) {
          // Validate that it's actually a PNG file
          if (await this.validatePngFile(cachePath)) {
            this.logger.log(`Successfully downloaded EPIC image: ${image_identifier}, size: ${stats.size} bytes`);
            return cachePath;
          } else {
            this.logger.warn(`Downloaded file is not a valid PNG, will retry: ${image_identifier}`);
            return this.cleanupAndRetry(image_identifier, date, cachePath);
          }
        } else {
          throw new Error(`Downloaded image file is empty: ${image_identifier}`);
        }
      } else {
        throw new Error(`Failed to create image file: ${image_identifier}`);
      }
    }
  }

  
  // ---------- CACHE FUNCTIONS ----------

  private async getEpicImagesFromCacheOrNasaApi(query: QueryEpicDto): Promise<EpicImagesResponse> {
    const date = query.date;
    const natural = query.natural !== false;

    const cacheKey = `${date}_${natural ? 'natural' : 'enhanced'}`;
    const cachePath = path.join(this.cacheDir, date, `${cacheKey}.json`);
    
    try {
      // create cache directory if it doesn't exist
      await fs.mkdir(path.join(this.cacheDir, date), { recursive: true });

      // 1. Check if cache exists
      const fileExists = await this.fileExistsAsync(cachePath);
      if (fileExists) {
        const cachedData = await fs.readFile(cachePath, 'utf-8');
        const parsedCache = JSON.parse(cachedData);
        this.logger.log(`Returning cached EPIC images for date: ${date}, natural: ${natural}`);
        
        // 2. return cached data
        return {
          items: parsedCache,
          status: 'cached',
          limit: 2000,
          remaining: 2000,
        };
      } else {
        // 3. fetch from NASA API
        const result = await this.nasaApiService.getEpicImages(date, natural);

        // 4. store data in cache
        await fs.writeFile(cachePath, JSON.stringify(result.data, null, 2));
        this.logger.log(`Cached EPIC images for date: ${date}, natural: ${natural}`);

        return {
          items: result.data,
          limit: result.limit,
          remaining: result.remaining,
          status: 'success',
        };
      }
      
    } catch (cacheError) {
      this.logger.error('Error getting EPIC images:', cacheError.message);
      return {
        items: [],
        status: 'failed',
        limit: 2000,
        remaining: 0,
      };
    }
  }

  public async fileExistsAsync(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async waitForFileStability(filePath: string, maxWaitMs: number = 5000): Promise<void> {
    const startTime = Date.now();
    let lastSize = 0;
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.size > 0 && stats.size === lastSize) {
          // File size is stable, consider it complete
          return;
        }
        lastSize = stats.size;
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before checking again
      } catch {
        // File might not exist yet, wait a bit more
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // If we reach here, the file might still be downloading
    this.logger.warn(`File stability timeout for: ${filePath}`);
  }

  async getLatestEpicImages(): Promise<EpicImage[]> {
    try {
      this.logger.log('Getting latest EPIC images');
      
      return await this.nasaApiService.getLatestEpicImages();
    } catch (error) {
      this.logger.error('Error getting latest EPIC images:', error.message);
      throw error;
    }
  }
}
