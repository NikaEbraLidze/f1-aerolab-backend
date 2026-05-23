import { config } from 'dotenv';

config();

export const corsOrigin =
  process.env.CORS_ORIGIN ?? 'http://localhost:3000';
