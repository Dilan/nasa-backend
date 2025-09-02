import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerMiddleware } from '../common/middleware/logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EpicModule } from '../epic/epic.module';
import { ApodModule } from '../apod/apod.module';
import { NasaApiModule } from '../nasa-api/nasa-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    HttpModule,
    NasaApiModule,
    EpicModule,
    ApodModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
