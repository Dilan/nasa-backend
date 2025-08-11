import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  Res,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { EpicService } from './epic.service';
import { EpicType } from '../nasa-api/nasa-api.service';
import { QueryEpicDto } from './dto/query-epic.dto';
import { Public } from '../common/decorators/public.decorator';
import * as fs from 'fs';

@Public()
@Controller('epic')
export class EpicController {
  private readonly logger = new Logger(EpicController.name);
  constructor(private readonly epicService: EpicService) {}

  @Get()
  async getEpicImages(
    @Query() query: QueryEpicDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.epicService.getEpicImages(query);

    // Headers: [x-ratelimit-remaining] & [x-ratelimit-limit]
    if (result.remaining) {
      res.setHeader('x-ratelimit-remaining', result.remaining);
      res.setHeader('x-ratelimit-limit', result.limit);
    }
    return result.data;
  }

  @Get('available-dates')
  async getAvailableDates(
    @Query('type') type: EpicType,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!type) {
      type = 'natural';
    } // if type is not provided, default to 'natural'
    const result = await this.epicService.getAvailableDates(type);

    // Headers: [x-ratelimit-remaining] & [x-ratelimit-limit]
    if (result.remaining) {
      res.setHeader('x-ratelimit-remaining', result.remaining);
      res.setHeader('x-ratelimit-limit', result.limit);
    }
    return result.data;
  }

  @Get('image/:identifier')
  async getEpicImageByIdentifier(
    @Param('identifier') identifier: string,
    @Res() res: Response,
  ) {
    try {
      const date = extractDateFromIdentifier(identifier);
      if (!date) {
        throw new NotFoundException('Invalid identifier');
      }
      const imagePath = await this.epicService.getEpicImageByIdentifier(
        identifier,
        date,
      );

      if (!fs.existsSync(imagePath)) {
        this.logger.error(`Image file not found at path: ${imagePath}`);
        throw new NotFoundException('Image not found');
      }

      // Get file stats to check if file is complete
      const stats = fs.statSync(imagePath);
      this.logger.log(
        `Image file stats: ${imagePath}, size: ${stats.size} bytes`,
      );

      if (stats.size === 0) {
        this.logger.error(`Image file is empty: ${imagePath}`);
        throw new NotFoundException('Image file is empty or incomplete');
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Length', stats.size);

      this.logger.log(`Starting to stream image: ${identifier}`);

      // Stream file instead of reading into memory with proper error handling
      const stream = fs.createReadStream(imagePath);

      stream.on('error', (error) => {
        this.logger.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream image' });
        }
      });

      stream.on('end', () => {
        // Stream completed successfully
        this.logger.log(`Successfully streamed image: ${identifier}`);
      });

      // Handle client disconnect
      res.on('close', () => {
        this.logger.log(
          `Client disconnected, destroying stream for: ${identifier}`,
        );
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error) {
      this.logger.error('Error serving image:', error);
      if (!res.headersSent) {
        if (error instanceof NotFoundException) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  }
}

const extractDateFromIdentifier = (identifier: string): string | null => {
  const regex = /(20\d{6})/;
  const match = regex.exec(identifier);
  if (!match) return null; // No date found

  const [year, month, day] = [
    match[1].slice(0, 4),
    match[1].slice(4, 6),
    match[1].slice(6, 8),
  ];
  return `${year}-${month}-${day}`;
};
