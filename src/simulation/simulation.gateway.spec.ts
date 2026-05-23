import { SimulationGateway } from './simulation.gateway';

const mockSimulationService = { run: jest.fn() };

describe('SimulationGateway', () => {
  let gateway: SimulationGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new SimulationGateway(mockSimulationService as any);
  });

  it('handleSimulateUpdate returns simulate:result on success', () => {
    const params = {
      speed: 280,
      wingAngle: 15,
      weight: 740,
      dragCoefficient: 0.95,
    };
    const aeroResult = { downforce: 9800, drag: 6200 };
    mockSimulationService.run.mockReturnValue(aeroResult);

    const result = gateway.handleSimulateUpdate(params as any);

    expect(mockSimulationService.run).toHaveBeenCalledWith(params);
    expect(result).toEqual({ event: 'simulate:result', data: aeroResult });
  });
});
