const STATUS_INTERVAL_MS = 30000;

let lastStatusKey = '';

export function startLlmStatusConsoleMonitor() {
  checkAndLogLlmStatus();
  window.setInterval(checkAndLogLlmStatus, STATUS_INTERVAL_MS);
}

async function checkAndLogLlmStatus() {
  const status = await fetchLlmStatus();
  const statusKey = `${status.state}:${status.detail}`;
  if (statusKey === lastStatusKey) return;

  lastStatusKey = statusKey;
  const log = status.state === 'connected' ? console.log : console.warn;
  log(`[LLM] ${status.state}: ${status.detail}`);
}

async function fetchLlmStatus() {
  try {
    const response = await fetch('/api/llm-status');
    if (!response.ok) {
      return {
        state: 'unavailable',
        detail: `status endpoint returned ${response.status}`,
      };
    }

    const status = await response.json();
    if (typeof status?.state === 'string' && typeof status?.detail === 'string') {
      return status;
    }

    return {
      state: 'unavailable',
      detail: 'status endpoint returned an invalid payload',
    };
  } catch (error) {
    return {
      state: 'unavailable',
      detail: error.message,
    };
  }
}
