import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

loadLocalEnv();

export const config = {
  port: Number(process.env.PORT ?? 8787),
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? process.env.NEWAPI_API_KEY ?? '',
    baseUrl: getOpenAiBaseUrl(),
    model: process.env.OPENAI_MODEL ?? process.env.NEWAPI_MODEL ?? 'gpt-4o-mini',
  },
};

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function getOpenAiBaseUrl() {
  if (process.env.OPENAI_BASE_URL) return normalizeBaseUrl(process.env.OPENAI_BASE_URL);
  if (process.env.NEWAPI_BASE_URL) return ensureV1Path(process.env.NEWAPI_BASE_URL);
  return 'https://api.openai.com/v1';
}

function ensureV1Path(url) {
  const normalized = normalizeBaseUrl(url);
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`;
}

function loadLocalEnv() {
  const serverDir = dirname(fileURLToPath(import.meta.url));
  const projectRoot = resolve(serverDir, '..');
  const envPath = resolve(projectRoot, '.env');
  if (existsSync(envPath)) readEnvFile(envPath);
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
