# F1 AeroLab Backend — Claude Code Context

## Project
F1 aerodynamics simulation API. Users send car parameters and receive calculated aerodynamic forces in real time via WebSocket, plus REST endpoints for preset CRUD.

**Current phase:** Phase 1 — Core simulation (no AI yet, no user auth)
**Next phase:** Phase 2 — OpenAI integration (AiModule)

## Tech Stack
- NestJS (framework)
- Prisma ORM + PostgreSQL (local install, no Docker)
- Socket.io via @nestjs/websockets (real-time)
- class-validator + class-transformer (DTO validation)
- @nestjs/config (env vars from .env)
- @nestjs/swagger (docs at /api)

## Module Structure

| Module | Owns |
|--------|------|
| `AeroModule` | Pure aerodynamic calculations — no DB, no side effects |
| `SimulationModule` | WebSocket gateway + REST /simulation/run |
| `PresetsModule` | CRUD for saved car setup presets |
| `PrismaModule` | Global Prisma client (injected everywhere) |
| `HealthController` | GET /health only |

## Coding Rules

1. **Business logic lives in services.** Controllers and gateways are thin — validate input, call service, return result. Never put calculations or DB queries in a controller.
2. **AeroService is pure.** No DB calls, no HTTP calls, no side effects. Same input always produces same output. This makes it easy to test.
3. **Thin gateways.** The WebSocket gateway only handles the socket event, delegates everything to SimulationService.
4. **DTOs for all input.** Every HTTP body and WebSocket payload must have a DTO with class-validator decorators.
5. **Test files co-located.** `aero.service.spec.ts` lives next to `aero.service.ts`, not in a separate `tests/` folder.
6. **No logic in app.module.ts.** It just imports modules.

## NestJS Patterns (Express developer reference)

**Module** = a feature boundary. Declares what it provides and exports.
**Controller** = handles HTTP routes (like Express router).
**Service** = contains business logic. Injectable via constructor.
**Gateway** = handles WebSocket events (like a controller but for sockets).
**DTO** = defines + validates the shape of incoming data.

Creating a new module:
```bash
nest generate module feature-name
nest generate service feature-name
nest generate controller feature-name
```

## Prisma Workflow

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Prisma generates new typed client automatically
4. Inject `PrismaService` in any service constructor — it's global

## WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `simulate:update` | `{ speed, wingAngle, weight, dragCoefficient }` |
| Server → Client | `simulate:result` | `{ downforce, drag, lift, aeroEfficiency, grip, weightTransfer, chartData }` |
| Server → Client | `simulate:error` | `{ message }` |

chartData: 41 points, speed 0–400 km/h in steps of 10.

## Aerodynamic Constants
- ρ (air density) = 1.225 kg/m³
- A (frontal area) = 1.5 m²
- g = 9.81 m/s²
- Cl = wingAngle × 0.1 (linear approximation)
- Speed conversion: v(m/s) = speed(km/h) / 3.6

## Running Locally
```bash
npm run start:dev     # development with hot reload
npm run test          # unit tests
npm run test:watch    # watch mode
npx prisma studio     # GUI for the database
```

## Out of Scope (this phase)
- User authentication
- OpenAI/AI integration (Phase 2)
- C# physics engine
- Frontend (separate repo: f1-aerolab-frontend)
