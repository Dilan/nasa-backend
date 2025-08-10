import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface EpicImage {
  identifier: string;
  caption: string;
  image: string;
  version: string;
  centroid_coordinates: {
    lat: number;
    lon: number;
  };
  dscovr_j2000_position: {
    x: number;
    y: number;
    z: number;
  };
  lunar_j2000_position: {
    x: number;
    y: number;
    z: number;
  };
  sun_j2000_position: {
    x: number;
    y: number;
    z: number;
  };
  attitude_quaternions: {
    q0: number;
    q1: number;
    q2: number;
    q3: number;
  };
  date: string;
  coords: {
    centroid_coordinates: {
      lat: number;
      lon: number;
    };
    dscovr_j2000_position: {
      x: number;
      y: number;
      z: number;
    };
    lunar_j2000_position: {
      x: number;
      y: number;
      z: number;
    };
    sun_j2000_position: {
      x: number;
      y: number;
      z: number;
    };
    attitude_quaternions: {
      q0: number;
      q1: number;
      q2: number;
      q3: number;
    };
  };
}

@Injectable()
export class NasaApiService {
  private readonly logger = new Logger(NasaApiService.name);
  private readonly epicBaseUrl = 'https://api.nasa.gov/EPIC/api';
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NASA_API_KEY') || 'DEMO_KEY';
  }

  // EPIC API Methods
  async getEpicImages(date?: string, natural: boolean = true): Promise<EpicImage[]> {
    try {
      const targetDate = date || this.getDefaultDate();
      const type = natural ? 'natural' : 'enhanced';

      const url = `${this.epicBaseUrl}/${type}/date/${targetDate}`;
      const params = { api_key: this.apiKey };

      this.logger.log(`Fetching EPIC images for date: ${targetDate}, type: ${type}`);

      const response = await axios.get<EpicImage[]>(url, { params });

      this.logger.log(`Retrieved ${response.data.length} EPIC images`);
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching EPIC images:', error.message);
      throw error;
    }
  }

  async getEpicImageByIdentifier(image: string, date: string): Promise<string> {
    try {
      // replace date to YYYY/MM/DD
      const formatDate = date.replace(/-/g, '/');
      const url = `${this.epicBaseUrl}/archive/natural/${formatDate}/png/${image}`;
      const params = { api_key: this.apiKey };

      this.logger.log(`Fetching EPIC image with identifier: ${image}`);

      // get PNG image from url
      const response = await axios.get(url, { params, responseType: 'arraybuffer' });

      // convert to base64
      const base64 = Buffer.from(response.data, 'binary').toString('base64');

      return base64;
    } catch (error) {
      this.logger.error(
        'Error fetching EPIC image by identifier:',
        error.message,
      );
      throw error;
    }
  }

  async getLatestEpicImages(): Promise<EpicImage[]> {
    try {
      const url = `${this.epicBaseUrl}/natural/latest`;
      const params = { api_key: this.apiKey };

      this.logger.log('Fetching latest EPIC images');

      const response = await axios.get<EpicImage[]>(url, { params });

      this.logger.log(`Retrieved ${response.data.length} latest EPIC images`);
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching latest EPIC images:', error.message);
      throw error;
    }
  }

  // Add more NASA API endpoints here as needed
  // For example: APOD, Mars Rover, etc.

  private getDefaultDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
} 