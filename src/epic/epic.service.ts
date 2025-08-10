import { Injectable, Logger } from '@nestjs/common';
import { NasaApiService, EpicImage } from '../nasa-api/nasa-api.service';
import { QueryEpicDto } from './dto/query-epic.dto';

@Injectable()
export class EpicService {
  private readonly logger = new Logger(EpicService.name);

  constructor(private readonly nasaApiService: NasaApiService) {}

  async getEpicImages(query: QueryEpicDto): Promise<EpicImage[]> {
    try {
      const date = query.date;
      const natural = query.natural !== false;

      this.logger.log(`Getting EPIC images for date: ${date}, natural: ${natural}`);
      
      return await this.nasaApiService.getEpicImages(date, natural);
    } catch (error) {
      this.logger.error('Error getting EPIC images:', error.message);
      throw error;
    }
  }

  async getEpicImageByIdentifier(identifier: string, date: string): Promise<string> {
    try {
      this.logger.log(`Getting EPIC image with identifier: ${identifier}`);
      
      return await this.nasaApiService.getEpicImageByIdentifier(identifier, date);
    } catch (error) {
      this.logger.error('Error getting EPIC image by identifier:', error.message);
      throw error;
    }
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
