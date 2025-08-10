import { Test } from '@nestjs/testing';
import { EpicModule } from './epic.module';
import { EpicController } from './epic.controller';
import { EpicService } from './epic.service';

describe('EpicModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [EpicModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide EpicController', async () => {
    const module = await Test.createTestingModule({
      imports: [EpicModule],
    }).compile();

    const controller = module.get<EpicController>(EpicController);
    expect(controller).toBeInstanceOf(EpicController);
  });

  it('should provide EpicService', async () => {
    const module = await Test.createTestingModule({
      imports: [EpicModule],
    }).compile();

    const service = module.get<EpicService>(EpicService);
    expect(service).toBeInstanceOf(EpicService);
  });

  it('should export EpicService', async () => {
    const module = await Test.createTestingModule({
      imports: [EpicModule],
    }).compile();

    const service = module.get<EpicService>(EpicService);
    expect(service).toBeDefined();
  });
});
