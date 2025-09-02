import { Test } from '@nestjs/testing';
import { ApodModule } from './apod.module';
import { ApodService } from './apod.service';
import { ApodController } from './apod.controller';
import { CacheService } from './cache.service';

describe('ApodModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [ApodModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide ApodService', async () => {
    const module = await Test.createTestingModule({
      imports: [ApodModule],
    }).compile();

    const service = module.get<ApodService>(ApodService);
    expect(service).toBeInstanceOf(ApodService);
  });

  it('should provide ApodController', async () => {
    const module = await Test.createTestingModule({
      imports: [ApodModule],
    }).compile();

    const controller = module.get<ApodController>(ApodController);
    expect(controller).toBeInstanceOf(ApodController);
  });

  it('should provide CacheService', async () => {
    const module = await Test.createTestingModule({
      imports: [ApodModule],
    }).compile();

    const cacheService = module.get<CacheService>(CacheService);
    expect(cacheService).toBeInstanceOf(CacheService);
  });

  it('should export ApodService', async () => {
    const module = await Test.createTestingModule({
      imports: [ApodModule],
    }).compile();

    const service = module.get<ApodService>(ApodService);
    expect(service).toBeDefined();
  });
});
