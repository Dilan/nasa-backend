import { Controller, Get, Query, Param } from '@nestjs/common';
import { EpicService } from './epic.service';
import { QueryEpicDto } from './dto/query-epic.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('epic')
export class EpicController {
  constructor(private readonly epicService: EpicService) {}

  @Get()
  @Public()
  async getEpicImages(@Query() query: QueryEpicDto) {
    return await this.epicService.getEpicImages(query);
  }

  @Get('latest')
  @Public()
  async getLatestEpicImages() {
    return await this.epicService.getLatestEpicImages();
  }

  @Get('identifier/:identifier')
  @Public()
  async getEpicImageByIdentifier(
    @Param('identifier') identifier: string,
    @Query('date') date: string,
  ) {
    return await this.epicService.getEpicImageByIdentifier(identifier, date);
  }
}
