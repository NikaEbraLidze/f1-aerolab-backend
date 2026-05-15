# F1 AeroLab Backend — Build Plan

Work through these tasks in order. Each task ends with a commit.

---

## Task 1: Environment & Config

**Goal:** Load environment variables globally.

Install dependencies:
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io \
  @prisma/client @nestjs/config class-validator class-transformer \
  @nestjs/swagger swagger-ui-express

npm install --save-dev prisma socket.io-client
```

Create `.env` (never commit this):
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/f1_aerolab"
PORT=3001
```

Update `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
```

```bash
git add src/app.module.ts .env.example
git commit -m "chore: install dependencies and add ConfigModule"
```

---

## Task 2: Prisma Setup

**Goal:** Connect to PostgreSQL and create the Preset table.

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE f1_aerolab;"
```

Initialize Prisma:
```bash
npx prisma init
```

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Preset {
  id              String   @id @default(cuid())
  name            String
  speed           Float
  wingAngle       Float
  weight          Float
  dragCoefficient Float
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Run migration:
```bash
npx prisma migrate dev --name init
```

Create `src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Create `src/prisma/prisma.module.ts`:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> `@Global()` makes PrismaService available everywhere without importing PrismaModule in every feature module.

Add PrismaModule to `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
})
export class AppModule {}
```

```bash
git add prisma/ src/prisma/ src/app.module.ts
git commit -m "feat: add Prisma with Preset model and PrismaModule"
```

---

## Task 3: Health Endpoint

**Goal:** GET /health returns `{ status: 'ok' }`.

Create `src/health/health.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return { status: 'ok' };
  }
}
```

Add to `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

```bash
git add src/health/ src/app.module.ts
git commit -m "feat: add health endpoint"
```

---

## Task 4: Aero Module — DTO + Service

**Goal:** Pure calculation engine. No DB, no side effects.

Create `src/aero/dto/simulate-params.dto.ts`:
```typescript
import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SimulateParamsDto {
  @ApiProperty({ description: 'Car speed in km/h', minimum: 0, maximum: 400 })
  @IsNumber()
  @Min(0)
  @Max(400)
  speed: number;

  @ApiProperty({ description: 'Front wing angle in degrees', minimum: 0, maximum: 30 })
  @IsNumber()
  @Min(0)
  @Max(30)
  wingAngle: number;

  @ApiProperty({ description: 'Car weight in kg', minimum: 600, maximum: 1000 })
  @IsNumber()
  @Min(600)
  @Max(1000)
  weight: number;

  @ApiProperty({ description: 'Drag coefficient (Cd)', minimum: 0.5, maximum: 1.5 })
  @IsNumber()
  @Min(0.5)
  @Max(1.5)
  dragCoefficient: number;
}
```

Create `src/aero/aero.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { SimulateParamsDto } from './dto/simulate-params.dto';

export interface ChartPoint {
  speed: number;
  downforce: number;
  drag: number;
}

export interface AeroResult {
  downforce: number;
  drag: number;
  lift: number;
  aeroEfficiency: number;
  grip: number;
  weightTransfer: number;
  chartData: ChartPoint[];
}

const RHO = 1.225;        // air density kg/m³ at sea level
const A = 1.5;            // reference frontal area m²
const G = 9.81;           // gravitational acceleration m/s²
const WHEELBASE = 3.6;    // typical F1 wheelbase m
const CG_HEIGHT = 0.3;    // typical F1 center of gravity height m
const BRAKING_ACCEL = 30; // typical F1 braking deceleration m/s² (~3g)

@Injectable()
export class AeroService {
  calculateAll(params: SimulateParamsDto): AeroResult {
    const { speed, wingAngle, weight, dragCoefficient } = params;

    const v = speed / 3.6;
    const Cl = wingAngle * 0.1;

    const downforce = Math.round(0.5 * RHO * v * v * Cl * A) || 0;
    const drag = Math.round(0.5 * RHO * v * v * dragCoefficient * A) || 0;
    const lift = -downforce || 0; // avoid -0 which fails Object.is equality in Jest
    const aeroEfficiency = drag > 0 ? Math.round((downforce / drag) * 1000) / 1000 : 0;
    const grip = Math.round(((downforce + weight * G) / (weight * G)) * 100) / 100;
    const weightTransfer = Math.round((weight * BRAKING_ACCEL * CG_HEIGHT) / WHEELBASE);

    const chartData: ChartPoint[] = Array.from({ length: 41 }, (_, i) => {
      const s = i * 10;
      const vs = s / 3.6;
      return {
        speed: s,
        downforce: Math.round(0.5 * RHO * vs * vs * Cl * A) || 0,
        drag: Math.round(0.5 * RHO * vs * vs * dragCoefficient * A) || 0,
      };
    });

    return { downforce, drag, lift, aeroEfficiency, grip, weightTransfer, chartData };
  }
}
```

Create `src/aero/aero.service.spec.ts`:
```typescript
import { AeroService } from './aero.service';

describe('AeroService', () => {
  let service: AeroService;

  beforeEach(() => {
    service = new AeroService();
  });

  it('returns zero forces when speed is 0', () => {
    const result = service.calculateAll({ speed: 0, wingAngle: 15, weight: 740, dragCoefficient: 0.95 });
    expect(result.downforce).toBe(0);
    expect(result.drag).toBe(0);
    expect(result.lift).toBe(0);
    expect(result.aeroEfficiency).toBe(0);
  });

  it('returns zero downforce when wingAngle is 0', () => {
    const result = service.calculateAll({ speed: 200, wingAngle: 0, weight: 740, dragCoefficient: 0.95 });
    expect(result.downforce).toBe(0);
    expect(result.lift).toBe(0);
  });

  it('calculates correct downforce at speed=360, wingAngle=10, weight=800, cd=1.0', () => {
    // v = 100 m/s, Cl = 1.0 → 0.5 * 1.225 * 10000 * 1.0 * 1.5 = 9187.5 ≈ 9188
    const result = service.calculateAll({ speed: 360, wingAngle: 10, weight: 800, dragCoefficient: 1.0 });
    expect(result.downforce).toBe(9188);
  });

  it('calculates correct drag at speed=360, wingAngle=10, weight=800, cd=1.0', () => {
    const result = service.calculateAll({ speed: 360, wingAngle: 10, weight: 800, dragCoefficient: 1.0 });
    expect(result.drag).toBe(9188);
  });

  it('aeroEfficiency is downforce/drag', () => {
    const result = service.calculateAll({ speed: 360, wingAngle: 10, weight: 800, dragCoefficient: 1.0 });
    expect(result.aeroEfficiency).toBe(1.0);
  });

  it('lift equals negative downforce', () => {
    const result = service.calculateAll({ speed: 200, wingAngle: 15, weight: 740, dragCoefficient: 0.95 });
    expect(result.lift).toBe(-result.downforce);
  });

  it('grip increases with speed and wing angle', () => {
    const low = service.calculateAll({ speed: 100, wingAngle: 5, weight: 740, dragCoefficient: 0.95 });
    const high = service.calculateAll({ speed: 300, wingAngle: 25, weight: 740, dragCoefficient: 0.95 });
    expect(high.grip).toBeGreaterThan(low.grip);
  });

  it('weightTransfer is 2000 for weight=800', () => {
    // (800 × 30 × 0.3) / 3.6 = 2000
    const result = service.calculateAll({ speed: 200, wingAngle: 10, weight: 800, dragCoefficient: 0.95 });
    expect(result.weightTransfer).toBe(2000);
  });

  it('returns 41 chartData points from speed 0 to 400', () => {
    const result = service.calculateAll({ speed: 200, wingAngle: 15, weight: 740, dragCoefficient: 0.95 });
    expect(result.chartData).toHaveLength(41);
    expect(result.chartData[0].speed).toBe(0);
    expect(result.chartData[40].speed).toBe(400);
  });

  it('chartData first point has zero forces', () => {
    const result = service.calculateAll({ speed: 200, wingAngle: 15, weight: 740, dragCoefficient: 0.95 });
    expect(result.chartData[0].downforce).toBe(0);
    expect(result.chartData[0].drag).toBe(0);
  });
});
```

Run tests:
```bash
npm run test -- --testPathPattern=aero.service
```
Expected: 10 tests pass.

Create `src/aero/aero.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { AeroService } from './aero.service';

@Module({
  providers: [AeroService],
  exports: [AeroService],
})
export class AeroModule {}
```

```bash
git add src/aero/
git commit -m "feat: implement AeroService with aerodynamic calculations"
```

---

## Task 5: Presets Module

**Goal:** CRUD endpoints for saved car setups — GET, POST, DELETE `/presets`.

Create `src/presets/dto/create-preset.dto.ts`:
```typescript
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { SimulateParamsDto } from '../../aero/dto/simulate-params.dto';

class PresetNameDto {
  @ApiProperty({ description: 'Name for this car setup preset' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreatePresetDto extends IntersectionType(PresetNameDto, SimulateParamsDto) {}
```

Create `src/presets/presets.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresetDto } from './dto/create-preset.dto';

@Injectable()
export class PresetsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.preset.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.preset.findUnique({ where: { id } });
  }

  create(dto: CreatePresetDto) {
    return this.prisma.preset.create({ data: dto });
  }

  remove(id: string) {
    return this.prisma.preset.delete({ where: { id } });
  }
}
```

Create `src/presets/presets.service.spec.ts`:
```typescript
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
    expect(mockPrisma.preset.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
  });

  it('findOne returns preset by id', async () => {
    const preset = { id: 'abc', name: 'Monaco' };
    mockPrisma.preset.findUnique.mockResolvedValue(preset);
    const result = await service.findOne('abc');
    expect(result).toEqual(preset);
    expect(mockPrisma.preset.findUnique).toHaveBeenCalledWith({ where: { id: 'abc' } });
  });

  it('findOne returns null when not found', async () => {
    mockPrisma.preset.findUnique.mockResolvedValue(null);
    expect(await service.findOne('x')).toBeNull();
  });

  it('create saves preset and returns it', async () => {
    const dto = { name: 'Monza', speed: 340, wingAngle: 5, weight: 740, dragCoefficient: 0.7 };
    const created = { id: 'xyz', ...dto };
    mockPrisma.preset.create.mockResolvedValue(created);
    const result = await service.create(dto as any);
    expect(result).toEqual(created);
    expect(mockPrisma.preset.create).toHaveBeenCalledWith({ data: dto });
  });

  it('remove deletes preset by id', async () => {
    mockPrisma.preset.delete.mockResolvedValue({ id: '1' });
    await service.remove('1');
    expect(mockPrisma.preset.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

Create `src/presets/presets.controller.ts`:
```typescript
import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PresetsService } from './presets.service';
import { CreatePresetDto } from './dto/create-preset.dto';

@ApiTags('presets')
@Controller('presets')
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get()
  @ApiOperation({ summary: 'List all saved presets' })
  findAll() {
    return this.presetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a preset by ID' })
  findOne(@Param('id') id: string) {
    return this.presetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a new preset' })
  create(@Body() dto: CreatePresetDto) {
    return this.presetsService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a preset' })
  remove(@Param('id') id: string) {
    return this.presetsService.remove(id);
  }
}
```

Create `src/presets/presets.controller.spec.ts`:
```typescript
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
    const dto = { name: 'Test', speed: 200, wingAngle: 10, weight: 740, dragCoefficient: 0.9 };
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
```

Create `src/presets/presets.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { PresetsController } from './presets.controller';
import { PresetsService } from './presets.service';

@Module({
  controllers: [PresetsController],
  providers: [PresetsService],
})
export class PresetsModule {}
```

Add to `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { PresetsModule } from './presets/presets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PresetsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

Run tests:
```bash
npm run test -- --testPathPattern=presets
```
Expected: 9 tests pass.

```bash
git add src/presets/ src/app.module.ts
git commit -m "feat: add PresetsModule with CRUD endpoints"
```

---

## Task 6: Simulation Module — REST + WebSocket

**Goal:** POST `/simulation/run` (one-shot REST) and `simulate:update` WebSocket event.

Create `src/simulation/simulation.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AeroService } from '../aero/aero.service';
import { SimulateParamsDto } from '../aero/dto/simulate-params.dto';

@Injectable()
export class SimulationService {
  constructor(private readonly aeroService: AeroService) {}

  async run(params: SimulateParamsDto) {
    return this.aeroService.calculateAll(params);
  }
}
```

Create `src/simulation/simulation.controller.ts`:
```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SimulationService } from './simulation.service';
import { SimulateParamsDto } from '../aero/dto/simulate-params.dto';

@ApiTags('simulation')
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('run')
  @ApiOperation({ summary: 'One-shot aerodynamic calculation' })
  run(@Body() params: SimulateParamsDto) {
    return this.simulationService.run(params);
  }
}
```

Create `src/simulation/simulation.controller.spec.ts`:
```typescript
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
      providers: [{ provide: SimulationService, useValue: mockSimulationService }],
    }).compile();
    controller = module.get(SimulationController);
  });

  it('run delegates to SimulationService', async () => {
    const params = { speed: 200, wingAngle: 15, weight: 740, dragCoefficient: 0.95 };
    mockSimulationService.run.mockResolvedValue({ downforce: 4253 });
    await controller.run(params as any);
    expect(mockSimulationService.run).toHaveBeenCalledWith(params);
  });
});
```

Create `src/simulation/simulation.gateway.ts`:
```typescript
import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SimulationService } from './simulation.service';
import { SimulateParamsDto } from '../aero/dto/simulate-params.dto';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000' },
  namespace: '/',
})
export class SimulationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly simulationService: SimulationService) {}

  @SubscribeMessage('simulate:update')
  async handleSimulateUpdate(@MessageBody() params: SimulateParamsDto) {
    try {
      const result = await this.simulationService.run(params);
      return { event: 'simulate:result', data: result };
    } catch (error) {
      return { event: 'simulate:error', data: { message: error.message } };
    }
  }
}
```

Create `src/simulation/simulation.gateway.spec.ts`:
```typescript
import { SimulationGateway } from './simulation.gateway';

const mockSimulationService = { run: jest.fn() };

describe('SimulationGateway', () => {
  let gateway: SimulationGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new SimulationGateway(mockSimulationService as any);
  });

  it('handleSimulateUpdate returns simulate:result on success', async () => {
    const params = { speed: 280, wingAngle: 15, weight: 740, dragCoefficient: 0.95 };
    const aeroResult = { downforce: 9800, drag: 6200 };
    mockSimulationService.run.mockResolvedValue(aeroResult);

    const result = await gateway.handleSimulateUpdate(params as any);

    expect(result).toEqual({ event: 'simulate:result', data: aeroResult });
  });

  it('handleSimulateUpdate returns simulate:error on failure', async () => {
    mockSimulationService.run.mockRejectedValue(new Error('Calculation failed'));

    const result = await gateway.handleSimulateUpdate({} as any);

    expect(result).toEqual({ event: 'simulate:error', data: { message: 'Calculation failed' } });
  });
});
```

Create `src/simulation/simulation.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { SimulationGateway } from './simulation.gateway';
import { AeroModule } from '../aero/aero.module';

@Module({
  imports: [AeroModule],
  controllers: [SimulationController],
  providers: [SimulationService, SimulationGateway],
  exports: [SimulationService],
})
export class SimulationModule {}
```

Add to `src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { PresetsModule } from './presets/presets.module';
import { SimulationModule } from './simulation/simulation.module';
import { AeroModule } from './aero/aero.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AeroModule,
    PresetsModule,
    SimulationModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

Run tests:
```bash
npm run test -- --testPathPattern=simulation
```
Expected: 3 tests pass.

```bash
git add src/simulation/ src/app.module.ts
git commit -m "feat: add SimulationModule with REST and WebSocket"
```

---

## Task 7: Bootstrap — ValidationPipe, Swagger, CORS

**Goal:** Wire up global validation, Swagger docs, and CORS.

Replace `src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: 'http://localhost:3000' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('F1 AeroLab API')
    .setDescription('Real-time F1 aerodynamics simulation API')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`F1 AeroLab backend running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api`);
}

bootstrap();
```

Start the server and verify:
```bash
npm run start:dev
```

- `http://localhost:3001/health` → `{"status":"ok"}`
- `http://localhost:3001/api` → Swagger UI

Run the full test suite:
```bash
npm run test
```
Expected: all tests pass.

```bash
git add src/main.ts
git commit -m "feat: configure ValidationPipe, Swagger, and CORS"
```

---

## Final Check

```bash
# All tests pass
npm run test

# TypeScript compiles cleanly
npm run build

# Manual smoke test
curl http://localhost:3001/health

curl -X POST http://localhost:3001/simulation/run \
  -H "Content-Type: application/json" \
  -d '{"speed":200,"wingAngle":15,"weight":740,"dragCoefficient":0.95}'

curl -X POST http://localhost:3001/presets \
  -H "Content-Type: application/json" \
  -d '{"name":"Monaco Setup","speed":240,"wingAngle":20,"weight":795,"dragCoefficient":1.1}'

curl http://localhost:3001/presets
```
