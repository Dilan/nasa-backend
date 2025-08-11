import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface CacheOptions {
  cacheDir?: string;
  maxWaitMs?: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cacheDir: string;
  private readonly maxWaitMs: number;

  constructor(options: CacheOptions = {}) {
    this.cacheDir = options.cacheDir || '.cache';
    this.maxWaitMs = options.maxWaitMs || 5000;
  }

  /**
   * Check if cache exists and return cached data
   */
  async getCachedData<T>(cachePath: string): Promise<T | null> {
    try {
      const fileExists = await this.fileExists(cachePath);
      if (fileExists) {
        const cachedData = await fs.readFile(cachePath, 'utf-8');
        const parsedCache = JSON.parse(cachedData) as T;
        this.logger.log(`Returning cached data from: ${cachePath}`);
        return parsedCache;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Error reading cache from ${cachePath}:`, error.message);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  async setCachedData<T>(cachePath: string, data: T): Promise<void> {
    try {
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
      this.logger.log(`Data cached successfully to: ${cachePath}`);
    } catch (error) {
      this.logger.error(`Error writing cache to ${cachePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for file stability to ensure download is complete
   */
  async waitForFileStability(filePath: string): Promise<void> {
    const startTime = Date.now();
    let lastSize = 0;
    
    while (Date.now() - startTime < this.maxWaitMs) {
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

  /**
   * Validate PNG file by checking magic number
   */
  async validatePngFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      // Check PNG magic number (first 8 bytes)
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      return buffer.subarray(0, 8).equals(pngSignature);
    } catch {
      return false;
    }
  }

  /**
   * Remove corrupted cache file
   */
  async removeCorruptedFile(filePath: string): Promise<void> {
    try {
      if (await this.fileExists(filePath)) {
        await fs.unlink(filePath);
        this.logger.warn(`Removed corrupted file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Error removing corrupted file ${filePath}:`, error.message);
    }
  }

  /**
   * Get cache path for a specific date and type
   */
  getCachePath(date: string, type: string, extension: string = 'json'): string {
    return path.join(this.cacheDir, date, `${date}_${type}.${extension}`);
  }

  /**
   * Get image cache path for a specific identifier and date
   */
  getImageCachePath(date: string, imageIdentifier: string): string {
    return path.join(this.cacheDir, date, 'images', `${imageIdentifier}.png`);
  }

  /**
   * Ensure cache directory exists
   */
  async ensureCacheDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }
} 