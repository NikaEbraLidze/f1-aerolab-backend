import { Test } from '@nestjs/testing';
import { PresetsController } from './presets.controller';
import { PresetsService } from './presets.service';

const mockPresetsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

describe('PresetsController', () => {
  let controller: PresetsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [PresetsController],
      providers: [{ provide: PresetsService, useValue: mockPresetsService }],
    }).compile();
    controller = module.get(PresetsController);
  });

  it('findAll delegates to service', async () => {
    mockPresetsService.findAll.mockResolvedValue([]);
    await controller.findAll();
    expect(mockPresetsService.findAll).toHaveBeenCalled();
  });

  it('findOne delegates to service with id', async () => {
    mockPresetsService.findOne.mockResolvedValue({ id: '1' });
    await controller.findOne('1');
    expect(mockPresetsService.findOne).toHaveBeenCalledWith('1');
  });

  it('create delegates to service with dto', async () => {
    const dto = {
      name: 'Test',
      speed: 200,
      wingAngle: 10,
      weight: 740,
      dragCoefficient: 0.9,
    };
    mockPresetsService.create.mockResolvedValue({ id: '1', ...dto });
    await controller.create(dto as any);
    expect(mockPresetsService.create).toHaveBeenCalledWith(dto);
  });

  it('remove delegates to service with id', async () => {
    mockPresetsService.remove.mockResolvedValue(undefined);
    await controller.remove('1');
    expect(mockPresetsService.remove).toHaveBeenCalledWith('1');
  });
});
