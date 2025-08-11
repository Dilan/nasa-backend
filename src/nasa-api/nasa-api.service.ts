import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

export interface EpicImage {
  identifier: string;
  caption: string;
  image: string;
  version: string;
  date: string;
}

export interface NasaApiResponse {
  data: any;
  status: string;
  limit: number;
  remaining: number;
}

// natural or enhanced
export type EpicType = 'natural' | 'enhanced';

@Injectable()
export class NasaApiService {
  private readonly logger = new Logger(NasaApiService.name);
  private readonly baseUrl = 'https://api.nasa.gov';
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DEMO_KEY');
  }

  // type could be "natural" or "enhanced"
  // data is an array of dates
  async getAvailableDates(type: EpicType = 'natural'): Promise<NasaApiResponse> {
    const url = `${this.baseUrl}/EPIC/api/${type}/available`;
    const params = { api_key: this.apiKey };
    const response = await axios.get<string[]>(url, { params });
    
    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    
    return {
      data: response.data,
      status: 'success',
      limit: parseInt(limit),
      remaining: parseInt(remaining),
    };
  }

  // EPIC API Methods
  async getEpicImages(date: string | undefined, type: EpicType = 'natural'): Promise<{ data: EpicImage[], status: string, limit: number, remaining: number }> {
    try {
      const targetDate = date;

      const url = `${this.baseUrl}/EPIC/api/${type}` + (date ? `/date/${targetDate}` : '');
      const params = { api_key: this.apiKey };

      this.logger.log(`Fetching EPIC images for date: ${targetDate}, type: ${type}`);

      const response = await axios.get<EpicImage[]>(url, { params });

      const remaining = response.headers['x-ratelimit-remaining'];
      const limit = response.headers['x-ratelimit-limit'];
      this.logger.log(`Remaining requests: ${remaining} out of ${limit}`);
      this.logger.log(`Retrieved ${response.data.length} EPIC images`);

      return {
        data: response.data,
        status: 'success',
        limit: parseInt(limit),
        remaining: parseInt(remaining),
      };
    } catch (error) {
      this.logger.error('Error fetching EPIC images:', error.message);
      throw error;
    }
  }

  // https://api.nasa.gov/EPIC/archive/natural/2025/07/15/png/epic_1b_20250715060350.png?api_key=TOtICCD1wYJXzVz37hDEc1nrJ2Pju2BQzZDMTmho
  // https://api.nasa.gov/EPIC/archive/natural/2020/07/15/png/epic_1b_20200715001752.png?api_key=TOtICCD1wYJXzVz37hDEc1nrJ2Pju2BQzZDMTmho
  async saveEpicImageByIdentifier(imageIdentifier: string, date: string, savePath: string, retryCount: number = 0): Promise<string> {
    const maxRetries = 3;
    
    try {
      // replace date to YYYY/MM/DD
      const formatDate = date.replace(/-/g, '/');
      const url = `${this.baseUrl}/EPIC/archive/natural/${formatDate}/png/${imageIdentifier}.png`;
      const params = { api_key: this.apiKey };

      this.logger.log(`Fetching EPIC image with identifier: ${imageIdentifier}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

      // axios stream to writer file with proper completion handling
      const writer = fs.createWriteStream(savePath);

      // console.log(url + '?api_key=' + this.apiKey);
      
      const response = await axios.get(url, { 
        params, 
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        maxContentLength: 50 * 1024 * 1024, // 50MB max
      });
      
      // Return a promise that resolves when the stream is complete
      return new Promise((resolve, reject) => {
        const stream = response.data;
        
        stream.on('error', (error) => {
          this.logger.error(`Stream error for ${imageIdentifier}:`, error.message);
          writer.end();
          reject(error);
        });

        writer.on('error', (error) => {
          this.logger.error(`Write error for ${imageIdentifier}:`, error.message);
          reject(error);
        });

        writer.on('finish', () => {
          this.logger.log(`Successfully saved EPIC image: ${imageIdentifier}`);
          resolve(savePath);
        });

        // Pipe the stream and end the writer when done
        stream.pipe(writer);
      });
    } catch (error) {
      this.logger.error(
        `Error fetching EPIC image by identifier: ${imageIdentifier}, date: ${date}, error: ${error.message}`,
      );
      
      // Clean up partial file if it exists
      try {
        if (fs.existsSync(savePath)) {
          fs.unlinkSync(savePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      // Retry logic
      if (retryCount < maxRetries) {
        this.logger.log(`Retrying download for ${imageIdentifier} (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.saveEpicImageByIdentifier(imageIdentifier, date, savePath, retryCount + 1);
      }
      
      throw new NotFoundException('Image not found after multiple attempts');
    }
  }
} 