import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  spotifyClientId: required('SPOTIFY_CLIENT_ID'),
  spotifyClientSecret: required('SPOTIFY_CLIENT_SECRET'),
  spotifyRedirectUri: required('SPOTIFY_REDIRECT_URI'),
  port: Number(process.env.PORT ?? 3001),
  reccobeatsBaseUrl: process.env.RECCOBEATS_BASE_URL ?? 'https://api.reccobeats.com',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173',
};
