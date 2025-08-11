import { Module } from '@nestjs/common';
import { EpicService } from './epic.service';
import { EpicController } from './epic.controller';
import { NasaApiModule } from '../nasa-api/nasa-api.module';
import { CacheService } from './cache.service';

@Module({
  imports: [NasaApiModule],
  controllers: [EpicController],
  providers: [
    EpicService,
    {
      provide: CacheService,
      useFactory: () =>
        new CacheService({
          cacheDir: '.cache/epic',
          maxWaitMs: 5000,
        }),
    },
  ],
  exports: [EpicService],
})
export class EpicModule {}
