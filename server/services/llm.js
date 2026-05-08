import { config } from '../config.js';
import { getPlantContext } from './plantDb.js';

const RESPONSE_SCHEMA = {
  intent: 'identify | resolveAmbiguity | compare | queryAttribute | unknown',
  marker: 'A | B | C when resolving ambiguity',
  target1: 'currentSelection when comparing',
  target2Name: 'plant name when comparing',
  attribute: 'droughtTolerance when comparing drought tolerance',
  referent: 'currentSelection when querying selected plant',
  interest: 'medicinalValue | unknown',
  confidence: 'number from 0 to 1',
};

export async function parseIntentWithLlm({ text, context }) {
  if (!config.newApiKey) {
    throw new Error('NEWAPI_API_KEY is not configured.');
  }

  const response = await fetch(`${config.newApiBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.newApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.newApiModel,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You parse user utterances for a 3D botanical garden demo.',
            'Return only JSON. Do not include markdown.',
            `Allowed response shape: ${JSON.stringify(RESPONSE_SCHEMA)}`,
            `Available plants: ${JSON.stringify(getPlantContext())}`,
          ].join('\n'),
        },
        {
          role: 'user',
          content: JSON.stringify({ text, context }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM response did not include content.');

  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed.intent !== 'string') {
    throw new Error('LLM response did not include an intent.');
  }
  return parsed;
}
