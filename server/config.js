import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

loadLocalEnv();

export const config = {
  port: Number(process.env.PORT ?? 8787),
  newApiKey: process.env.NEWAPI_API_KEY ?? '',
  newApiBaseUrl: normalizeBaseUrl(process.env.NEWAPI_BASE_URL ?? 'https://newapi.gisphere.info'),
  newApiModel: process.env.NEWAPI_MODEL ?? 'gpt nano',
};

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function loadLocalEnv() {
  const serverDir = dirname(fileURLToPath(import.meta.url));
  const envPaths = [resolve(serverDir, '.env'), resolve(process.cwd(), '.env')];
  envPaths.filter((envPath, index) => envPaths.indexOf(envPath) === index).forEach((envPath) => {
    if (!existsSync(envPath)) return;
    readEnvFile(envPath);
  });
}

function readEnvFile(envPath) {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const splitAt = trimmed.indexOf('=');
    if (splitAt === -1) return;
    const key = trimmed.slice(0, splitAt).trim();
    const value = trimmed.slice(splitAt + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}
