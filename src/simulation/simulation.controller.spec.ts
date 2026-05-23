import { Test } from '@nestjs/testing';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';

const mockSimulationService = { run: jest.fn() };

describe('SimulationController', () => {
  let controller: SimulationController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      controllers: [SimulationController],
      providers: [
        { provide: SimulationService, useValue: mockSimulationService },
      ],
    }).compile();
    controller = module.get(SimulationController);
  });

  it('run delegates to SimulationService', () => {
    const params = {
      speed: 200,
      wingAngle: 15,
      weight: 740,
      dragCoefficient: 0.95,
    };
    mockSimulationService.run.mockReturnValue({ downforce: 4253 });
    controller.run(params as any);
    expect(mockSimulationService.run).toHaveBeenCalledWith(params);
  });
});
