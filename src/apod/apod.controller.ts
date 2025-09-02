import {
  Controller,
  Get,
  Query,
  Logger,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApodService } from './apod.service';
import { QueryApodDto } from './dto/query-apod.dto';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('apod')
export class ApodController {
  private readonly logger = new Logger(ApodController.name);
  
  constructor(private readonly apodService: ApodService) {}

  @Get()
  async getApodImages(
    @Query() query: QueryApodDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.apodService.getApodImages(query);
    // Headers: [x-ratelimit-remaining] & [x-ratelimit-limit]
    if (result.remaining) {
      res.setHeader('x-ratelimit-remaining', result.remaining);
      res.setHeader('x-ratelimit-limit', result.limit);
    }
    
    return result.data;
  }
}
