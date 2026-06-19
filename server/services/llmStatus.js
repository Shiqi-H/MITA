import { config } from '../config.js';

const STATUS_INTERVAL_MS = Number(process.env.LLM_STATUS_INTERVAL_MS ?? 30000);
const STATUS_TIMEOUT_MS = Number(process.env.LLM_STATUS_TIMEOUT_MS ?? 8000);

let lastStatusKey = '';

export function startLlmStatusMonitor() {
  checkAndLogLlmStatus();

  const timer = setInterval(checkAndLogLlmStatus, STATUS_INTERVAL_MS);
  timer.unref?.();
}

async function checkAndLogLlmStatus() {
  const status = await getLlmStatus();
  const statusKey = `${status.state}:${status.detail}`;
  if (statusKey === lastStatusKey) return;

  lastStatusKey = statusKey;
  const log = status.state === 'connected' ? console.log : console.warn;
  log(`[LLM] ${status.state}: ${status.detail}`);
}

export async function getLlmStatus() {
  if (!config.openai.apiKey) {
    return {
      state: 'disabled',
      detail: 'missing OPENAI_API_KEY or NEWAPI_API_KEY',
    };
  }

  if (!config.openai.model) {
    return {
      state: 'disabled',
      detail: 'missing OPENAI_MODEL or NEWAPI_MODEL',
    };
  }

  try {
    const response = await fetchWithTimeout(`${config.openai.baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      return {
        state: 'connected',
        detail: `${config.openai.baseUrl} (model: ${config.openai.model})`,
      };
    }

    return {
      state: 'unavailable',
      detail: `${response.status} ${response.statusText || 'response'} from ${config.openai.baseUrl}/models`,
    };
  } catch (error) {
    return {
      state: 'unavailable',
      detail: error.name === 'AbortError' ? `timeout after ${STATUS_TIMEOUT_MS}ms` : error.message,
    };
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
