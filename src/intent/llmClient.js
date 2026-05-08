import { parseIntentLocally } from './intentParser.js';

const INTENT_ENGINE = import.meta.env.VITE_INTENT_ENGINE ?? 'local';

export async function parseIntent(text, context) {
  if (INTENT_ENGINE !== 'llm') {
    return parseIntentLocally(text, context);
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
