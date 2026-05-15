# F1 AeroLab Backend — Local Setup

## Prerequisites
- Node.js 20+
- PostgreSQL (already installed locally)
- npm

## First-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database**
   ```bash
   psql -U postgres -c "CREATE DATABASE f1_aerolab;"
   ```

3. **Create .env from example**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set your PostgreSQL password.

4. **Run Prisma migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Start development server**
   ```bash
   npm run start:dev
   ```

Server runs at `http://localhost:3001`
Swagger docs at `http://localhost:3001/api`

## Useful Commands

```bash
npm run test                           # Run all unit tests
npm run test:watch                     # Watch mode
npm run build                          # Compile TypeScript
npx prisma studio                      # Database GUI in browser
npx prisma migrate dev --name <name>   # Apply schema changes
```
