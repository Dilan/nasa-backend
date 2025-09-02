import { Module } from '@nestjs/common';
import { ApodService } from './apod.service';
import { ApodController } from './apod.controller';
import { NasaApiModule } from '../nasa-api/nasa-api.module';
import { CacheService } from './cache.service';

@Module({
  imports: [NasaApiModule],
  controllers: [ApodController],
  providers: [
    ApodService,
    {
      provide: CacheService,
      useFactory: () =>
        new CacheService({
          cacheDir: '.cache/apod',
          maxWaitMs: 5000,
        }),
    },
  ],
  exports: [ApodService],
})
export class ApodModule {}
