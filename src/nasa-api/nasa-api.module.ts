import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NasaApiService } from './nasa-api.service';

@Module({
  imports: [ConfigModule],
  providers: [NasaApiService],
  exports: [NasaApiService],
})
export class NasaApiModule {}
