import { AeroService } from './aero.service';

describe('AeroService', () => {
  let service: AeroService;

  beforeEach(() => {
    service = new AeroService();
  });

  it('returns zero forces when speed is 0', () => {
    const result = service.calculateAll({
      speed: 0,
      wingAngle: 15,
      weight: 740,
      dragCoefficient: 0.95,
    });
    expect(result.downforce).toBe(0);
    expect(result.drag).toBe(0);
    expect(result.lift).toBe(0);
    expect(result.aeroEfficiency).toBe(0);
  });

  it('returns zero downforce when wingAngle is 0', () => {
    const result = service.calculateAll({
      speed: 200,
      wingAngle: 0,
      weight: 740,
      dragCoefficient: 0.95,
    });
    expect(result.downforce).toBe(0);
    expect(result.lift).toBe(0);
  });

  it('calculates correct downforce at speed=360, wingAngle=10, weight=800, cd=1.0', () => {
    // v = 100 m/s, Cl = 1.0 → 0.5 * 1.225 * 10000 * 1.0 * 1.5 = 9187.5 ≈ 9188
    const result = service.calculateAll({
      speed: 360,
      wingAngle: 10,
      weight: 800,
      dragCoefficient: 1.0,
    });
    expect(result.downforce).toBe(9188);
  });

  it('calculates correct drag at speed=360, wingAngle=10, weight=800, cd=1.0', () => {
    const result = service.calculateAll({
      speed: 360,
      wingAngle: 10,
      weight: 800,
      dragCoefficient: 1.0,
    });
    expect(result.drag).toBe(9188);
  });

  it('aeroEfficiency is downforce/drag', () => {
    const result = service.calculateAll({
      speed: 360,
      wingAngle: 10,
      weight: 800,
      dragCoefficient: 1.0,
    });
    expect(result.aeroEfficiency).toBe(1.0);
  });

  it('lift equals negative downforce', () => {
    const result = service.calculateAll({
      speed: 200,
      wingAngle: 15,
      weight: 740,
      dragCoefficient: 0.95,
    });
    expect(result.lift).toBe(-result.downforce);
  });

  it('grip increases with speed and wing angle', () => {
    const low = service.calculateAll({
      speed: 100,
      wingAngle: 5,
      weight: 740,
      dragCoefficient: 0.95,
    });
    const high = service.calculateAll({
      speed: 300,
      wingAngle: 25,
      weight: 740,
      dragCoefficient: 0.95,
    });
    expect(high.grip).toBeGreaterThan(low.grip);
  });

  it('weightTransfer is 2000 for weight=800', () => {
    // (800 × 30 × 0.3) / 3.6 = 2000
    const result = service.calculateAll({
      speed: 200,
      wingAngle: 10,
      weight: 800,
      dragCoefficient: 0.95,
    });
    expect(result.weightTransfer).toBe(2000);
  });

  it('returns 41 chartData points from speed 0 to 400', () => {
    const result = service.calculateAll({
      speed: 200,
      wingAngle: 15,
      weight: 740,
      dragCoefficient: 0.95,
    });
    expect(result.chartData).toHaveLength(41);
    expect(result.chartData[0].speed).toBe(0);
    expect(result.chartData[40].speed).toBe(400);
  });

  it('chartData first point has zero forces', () => {
    const result = service.calculateAll({
      speed: 200,
      wingAngle: 15,
      weight: 740,
      dragCoefficient: 0.95,
    });
    expect(result.chartData[0].downforce).toBe(0);
    expect(result.chartData[0].drag).toBe(0);
  });
});
