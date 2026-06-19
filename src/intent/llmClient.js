import { parseIntentLocally } from './intentParser.js';

const INTENT_ENGINE = import.meta.env.VITE_INTENT_ENGINE ?? 'local';

export async function parseIntent(text, context) {
  const deterministicIntent = parseIntentLocally(text, context);
  if (
    ['identify', 'resolveAmbiguity'].includes(deterministicIntent.intent) ||
    hasNamedCompareTarget(deterministicIntent)
  ) {
    return { ...deterministicIntent, source: 'local' };
  }

  if (INTENT_ENGINE !== 'llm') {
    return deterministicIntent;
  }

  try {
    const response = await fetch('/api/parse-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    });

    if (!response.ok) throw new Error(`Intent API failed: ${response.status}`);

    const intent = await response.json();
    if (!intent || typeof intent.intent !== 'string') {
      throw new Error('Intent API returned an invalid payload.');
    }
    return intent;
  } catch (error) {
    console.warn(error);
    return {
      ...parseIntentLocally(text, context),
      parserFallback: 'local',
    };
  }
}

function hasNamedCompareTarget(intent) {
  return intent.intent === 'compare' && intent.target2Referent === 'namedPlant' && Boolean(intent.target2Name);
}

export async function generateInfoSpeech({ plant, question = '', interest = '', history = [] }) {
  return postSpeech('/api/generate-info', { plant, question, interest, history });
}

export async function generateSceneSpeech({ plants, question = '', history = [], gardenSummary = [], currentScene = '' }) {
  return postSpeech('/api/generate-scene', { plants, question, history, gardenSummary, currentScene });
}

export async function generateCompareSpeech({ left, right, attribute = 'droughtTolerance', history = [] }) {
  return postSpeech('/api/compare', { left, right, attribute, history });
}

export async function generateDisambiguationSpeech(candidates) {
  return postSpeech('/api/generate-disambiguation', { candidates });
}

async function postSpeech(url, body) {
  if (INTENT_ENGINE !== 'llm') return '';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`${url} failed: ${response.status}`);
    const payload = await response.json();
    return typeof payload.speech === 'string' ? payload.speech : '';
  } catch (error) {
    console.warn(error);
    return '';
  }
}
