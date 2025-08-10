import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EpicService } from './epic.service';
import { EpicController } from './epic.controller';
import { NasaApiModule } from '../nasa-api/nasa-api.module';

@Module({
  imports: [NasaApiModule],
  controllers: [EpicController],
  providers: [EpicService],
  exports: [EpicService],
})
export class EpicModule {}
