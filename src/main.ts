import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'warn', 'debug', 'log', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Enable transformation
      whitelist: true, // Remove properties not in the DTO
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are provided
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const configService = app.get(ConfigService);

  Logger.log(`-----------------------------------------`);
  Logger.log(`Starting on port ${configService.get('PORT')}`, 'Bootstrap');
  Logger.log(`Version: ${configService.get('VERSION')}`, 'Bootstrap');
  Logger.log(`-----------------------------------------`, 'Bootstrap');

  await app.listen(parseInt(process.env.PORT, 10) || 4200);
}
bootstrap();
