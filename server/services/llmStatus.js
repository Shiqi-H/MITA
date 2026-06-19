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
  if (!config.llm.apiKey) {
    return {
      state: 'disabled',
      detail: 'missing LLM API key',
    };
  }

  if (!config.llm.model) {
    return {
      state: 'disabled',
      detail: 'missing LLM model',
    };
  }

  try {
    const response = await fetchWithTimeout(`${config.llm.baseUrl}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.llm.apiKey}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      return {
        state: 'connected',
        detail: `${config.llm.baseUrl} (model: ${config.llm.model})`,
      };
    }

    return {
      state: 'unavailable',
      detail: `${response.status} ${response.statusText || 'response'} from ${config.llm.baseUrl}/models`,
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
