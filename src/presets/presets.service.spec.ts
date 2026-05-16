import { PresetsService } from './presets.service';

const mockPrisma = {
  preset: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PresetsService', () => {
  let service: PresetsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PresetsService(mockPrisma as any);
  });

  it('findAll returns presets ordered by createdAt desc', async () => {
    const presets = [{ id: '1', name: 'Test' }];
    mockPrisma.preset.findMany.mockResolvedValue(presets);
    const result = await service.findAll();
    expect(result).toEqual(presets);
    expect(mockPrisma.preset.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findOne returns preset by id', async () => {
    const preset = { id: 'abc', name: 'Monaco' };
    mockPrisma.preset.findUnique.mockResolvedValue(preset);
    const result = await service.findOne('abc');
    expect(result).toEqual(preset);
    expect(mockPrisma.preset.findUnique).toHaveBeenCalledWith({
      where: { id: 'abc' },
    });
  });

  it('findOne returns null when not found', async () => {
    mockPrisma.preset.findUnique.mockResolvedValue(null);
    expect(await service.findOne('x')).toBeNull();
  });

  it('create saves preset and returns it', async () => {
    const dto = {
      name: 'Monza',
      speed: 340,
      wingAngle: 5,
      weight: 740,
      dragCoefficient: 0.7,
    };
    const created = { id: 'xyz', ...dto };
    mockPrisma.preset.create.mockResolvedValue(created);
    const result = await service.create(dto as any);
    expect(result).toEqual(created);
    expect(mockPrisma.preset.create).toHaveBeenCalledWith({ data: dto });
  });

  it('remove deletes preset by id', async () => {
    mockPrisma.preset.delete.mockResolvedValue({ id: '1' });
    await service.remove('1');
    expect(mockPrisma.preset.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });
});
