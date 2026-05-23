# F1 AeroLab Backend

NestJS API for F1 aerodynamics simulation — real-time WebSocket updates and REST endpoints for presets.

## Quick start

See [docs/dev-setup.md](docs/dev-setup.md) for first-time setup (PostgreSQL, `.env`, Prisma migrations).

```bash
npm install
npm run start:dev
```

Server: `http://localhost:3001` · Swagger: `http://localhost:3001/api/docs`

## Documentation

| Doc | Purpose |
|-----|---------|
| [dev-setup.md](docs/dev-setup.md) | Local environment setup |
| [websocket-events.md](docs/websocket-events.md) | WebSocket event contract (frontend) |
| [aero-formulas.md](docs/aero-formulas.md) | Aerodynamic formulas and constants |
| [CLAUDE.md](CLAUDE.md) | AI/coding context and project conventions |

REST endpoint details live in Swagger — no separate API reference doc.

## Commands

```bash
npm run start:dev    # development with hot reload
npm run test         # unit tests
npm run build        # compile
npx prisma studio    # database GUI
```
