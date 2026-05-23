# F1 AeroLab Backend

Real-time F1 aerodynamics simulation API built with NestJS. Send car setup parameters (speed, wing angle, weight, drag coefficient) and receive calculated downforce, drag, grip, and chart data — instantly over WebSocket or via a one-shot REST call. Save and manage car setup presets in PostgreSQL.

> Companion backend for **F1 AeroLab** — pairs with the [`f1-aerolab-frontend`](https://github.com/NikaEbraLidze/f1-aerolab-frontend) Next.js app.

---

## Features

- **Real-time simulation** — Socket.io WebSocket updates as parameters change
- **REST fallback** — `POST /simulation/run` for one-shot calculations
- **Preset CRUD** — persist named car setups to PostgreSQL via Prisma
- **Validated inputs** — `class-validator` DTOs on every HTTP body and WebSocket payload
- **Consistent API responses** — unified success/error envelopes across REST
- **Shared error handling** — same error codes and validation details on HTTP and WebSocket
- **Interactive docs** — Swagger UI at `/api/docs`
- **Unit tested** — co-located Jest specs for services, controllers, and common layer

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [NestJS 11](https://nestjs.com/) |
| Language | TypeScript |
| Database | PostgreSQL + [Prisma ORM](https://www.prisma.io/) |
| Real-time | [Socket.io](https://socket.io/) via `@nestjs/websockets` |
| Validation | `class-validator` · `class-transformer` |
| API docs | `@nestjs/swagger` |
| Testing | Jest |

---

## Architecture

```
src/
├── aero/           Pure aerodynamic calculations (no DB, no side effects)
├── simulation/     WebSocket gateway + REST /simulation/run
├── presets/        CRUD for saved car setups
├── common/         Response interceptor, exception filters, shared types
├── prisma/         Global Prisma client
├── health/         GET /health
└── config/         Environment-driven config (CORS)
```

```mermaid
flowchart LR
  Client -->|REST| Controller
  Client -->|WebSocket| Gateway
  Controller --> SimulationService
  Gateway --> SimulationService
  SimulationService --> AeroService
  Controller --> PresetsService
  PresetsService --> Prisma
```

**Design principles**

- Business logic lives in **services** — controllers and gateways stay thin
- `AeroService` is **pure** — same input always produces the same output
- HTTP success responses are wrapped by a global interceptor; errors by a global filter
- WebSocket errors use the same resolution logic via a dedicated WS exception filter

---

## API Overview

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/simulation/run` | One-shot aerodynamic calculation |
| `GET` | `/presets` | List all presets (newest first) |
| `POST` | `/presets` | Create a preset |
| `GET` | `/presets/:id` | Get preset by ID |
| `DELETE` | `/presets/:id` | Delete preset by ID |

Full request/response schemas: **http://localhost:3001/api/docs**

### Simulation Input

| Parameter | Unit | Range |
|-----------|------|-------|
| `speed` | km/h | 0 – 400 |
| `wingAngle` | degrees | 0 – 30 |
| `weight` | kg | 600 – 1000 |
| `dragCoefficient` | — | 0.1 – 2.0 |

### HTTP Response Envelope

All REST responses use a consistent shape:

**Success**
```json
{
  "success": true,
  "data": { },
  "timestamp": "2026-05-23T12:00:00.000Z",
  "path": "/simulation/run"
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "speed must not be greater than 400",
    "details": [{ "field": "speed", "constraints": ["..."] }]
  },
  "timestamp": "2026-05-23T12:00:00.000Z",
  "path": "/simulation/run"
}
```

Error codes: `VALIDATION_ERROR` · `BAD_REQUEST` · `NOT_FOUND` · `CONFLICT` · `INTERNAL_ERROR`

### WebSocket Events

Connect with a Socket.io client to `http://localhost:3001`.

| Direction | Event | Payload |
|-----------|-------|---------|
| Client → Server | `simulate:update` | `{ speed, wingAngle, weight, dragCoefficient }` |
| Server → Client | `simulate:result` | `{ downforce, drag, lift, aeroEfficiency, grip, weightTransfer, chartData }` |
| Server → Client | `simulate:error` | `{ code, message, details }` |

`chartData` contains 41 points from 0–400 km/h in steps of 10.

See [docs/websocket-events.md](docs/websocket-events.md) for full JSON examples.

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **PostgreSQL** (local install)
- **npm**

### Installation

```bash
# Clone the repository
git clone https://github.com/NikaEbraLidze/f1-aerolab-backend.git
cd f1-aerolab-backend

# Install dependencies
npm install

# Create the database
psql -U postgres -c "CREATE DATABASE f1_aerolab;"

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL password and CORS_ORIGIN

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3001 | API base |
| http://localhost:3001/api/docs | Swagger UI |
| http://localhost:3001/health | Health check |

Detailed setup guide: [docs/dev-setup.md](docs/dev-setup.md)

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/f1_aerolab` |
| `PORT` | HTTP server port | `3001` |
| `CORS_ORIGIN` | Allowed frontend origin (HTTP + WebSocket) | `http://localhost:3000` |

---

## Scripts

```bash
npm run start:dev     # Development with hot reload
npm run start:prod    # Production (requires npm run build first)
npm run build         # Compile TypeScript
npm run test          # Run unit tests
npm run test:watch    # Tests in watch mode
npm run test:cov      # Tests with coverage report
npm run lint          # ESLint
npx prisma studio     # Database GUI in browser
npx prisma migrate dev --name <name>   # Apply schema changes
```

---

## Aerodynamic Model

Simplified physics model for interactive simulation (not CFD):

```
ρ = 1.225 kg/m³    A = 1.5 m²    g = 9.81 m/s²
v (m/s) = speed (km/h) / 3.6
Cl = wingAngle × 0.1

Downforce = 0.5 × ρ × v² × Cl × A
Drag      = 0.5 × ρ × v² × Cd × A
Lift      = -Downforce
```

Full formulas, constants, and worked examples: [docs/aero-formulas.md](docs/aero-formulas.md)

---

## Project Structure

```
f1-aerolab-backend/
├── prisma/
│   └── schema.prisma          # Preset model
├── src/
│   ├── aero/                  # Pure calculation engine
│   ├── simulation/            # REST + WebSocket entry points
│   ├── presets/               # Preset CRUD
│   ├── common/                # Interceptors, filters, shared types
│   ├── prisma/                # PrismaModule (global)
│   ├── health/                # HealthController
│   ├── config/                # CORS config from .env
│   ├── app.module.ts
│   └── main.ts
├── docs/
│   ├── dev-setup.md
│   ├── websocket-events.md
│   └── aero-formulas.md
└── test/                      # E2E tests
```

---

## Testing

```bash
npm run test
```

Tests are co-located with source files (`*.spec.ts` next to `*.ts`). Prisma is mocked in unit tests — no real database required.

---

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| **Phase 1** | Current | Core simulation, presets, WebSocket, REST |
| **Phase 2** | Planned | OpenAI integration (AiModule) |
| Future | — | User authentication, C# physics engine |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/dev-setup.md](docs/dev-setup.md) | Step-by-step local setup |
| [docs/websocket-events.md](docs/websocket-events.md) | WebSocket contract for frontend |
| [docs/aero-formulas.md](docs/aero-formulas.md) | Physics formulas and constants |
| [CLAUDE.md](CLAUDE.md) | Coding conventions and AI context |

---

## License

UNLICENSED — private project.
