import { Controller, Get, Query, Param, NotFoundException, Res } from '@nestjs/common';
import { Response } from 'express';
import { EpicService } from './epic.service';
import { QueryEpicDto } from './dto/query-epic.dto';
import { Public } from '../common/decorators/public.decorator';
import * as fs from 'fs';

@Public()
@Controller('epic')
export class EpicController {
  constructor(private readonly epicService: EpicService) {}

  @Get()
  async getEpicImages(@Query() query: QueryEpicDto, @Res() res: Response) {
    const result = await this.epicService.getEpicImages(query);
    // add "x-ratelimit-remaining" and "x-ratelimit-limit" to headers
    res.setHeader('x-ratelimit-remaining', result.remaining);
    res.setHeader('x-ratelimit-limit', result.limit);

    console.log('result.items', result.items);
    return result.items;
  }

  @Get('image/:date/:identifier')
  async getEpicImageByIdentifier(
    @Param('date') date: string,
    @Param('identifier') identifier: string,
    @Res() res: Response,
  ) {
    try {
      console.log(`Requesting image: ${identifier} for date: ${date}`);
      
      let imagePath = await this.epicService.getEpicImageByIdentifier(identifier, date);

      if (!fs.existsSync(imagePath)) {
        console.error(`Image file not found at path: ${imagePath}`);
        throw new NotFoundException('Image not found');
      }

      // Get file stats to check if file is complete
      const stats = fs.statSync(imagePath);
      console.log(`Image file stats: ${imagePath}, size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        console.error(`Image file is empty: ${imagePath}`);
        throw new NotFoundException('Image file is empty or incomplete');
      }
    
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Length', stats.size);
    
      console.log(`Starting to stream image: ${identifier}`);
      
      // Stream file instead of reading into memory with proper error handling
      const stream = fs.createReadStream(imagePath);
      
      stream.on('error', (error) => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream image' });
        }
      });

      stream.on('end', () => {
        // Stream completed successfully
        console.log(`Successfully streamed image: ${identifier}`);
      });

      // Handle client disconnect
      res.on('close', () => {
        console.log(`Client disconnected, destroying stream for: ${identifier}`);
        stream.destroy();
      });

      stream.pipe(res);
    } catch (error) {
      console.error('Error serving image:', error);
      if (!res.headersSent) {
        if (error instanceof NotFoundException) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    }
  }

  @Get('latest')
  async getLatestEpicImages() {
    return await this.epicService.getLatestEpicImages();
  }

}
