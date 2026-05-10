import { config } from '../config.js';
import { getPlantContext } from './plantDb.js';

const RESPONSE_SCHEMA = {
  intent: 'identify | resolveAmbiguity | compare | queryAttribute | unknown',
  marker: 'A | B | C when resolving ambiguity',
  target1: 'currentSelection when comparing',
  target2Name: 'plant name when comparing',
  attribute: 'droughtTolerance when comparing drought tolerance',
  referent: 'currentSelection when querying selected plant, or namedPlant when user names a plant',
  targetPlantName: 'plant name when querying an attribute of a named plant',
  interest: 'medicinalValue | unknown',
  confidence: 'number from 0 to 1',
};

export async function parseIntentWithLlm({ text, context }) {
  const content = await chatCompletion(
    [
      {
        role: 'system',
        content: [
          'You parse user utterances for a 3D botanical garden demo.',
          'Return only JSON. Do not include markdown.',
          'Classify referential questions such as "what is this", "what plant is this", "what am I looking at", "what is in front of me", and "tell me about this plant" as intent "identify".',
          'If an utterance names a plant, return that plant in targetPlantName instead of resolving it to currentSelection.',
          `Allowed response shape: ${JSON.stringify(RESPONSE_SCHEMA)}`,
          `Available plants: ${JSON.stringify(getPlantContext())}`,
        ].join('\n'),
      },
      {
        role: 'user',
        content: JSON.stringify({ text, context }),
      },
    ],
    { json: true, temperature: 0 },
  );
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed.intent !== 'string') {
    throw new Error('LLM response did not include an intent.');
  }
  return parsed;
}

export async function generateInfoResponse({ plant, question = '', interest = '', history = [] }) {
  const content = await chatCompletion([
    {
      role: 'system',
      content: [
        'You are the spoken guide for a concise 3D botanical garden demo.',
        'Answer in one or two natural English sentences for text-to-speech.',
        'Use only the plant data provided. If the requested field is missing, say what is available instead.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({ plant: slimPlant(plant), question, interest, history }),
    },
  ]);
  return content.trim();
}

export async function generateCompareResponse({ left, right, attribute = 'droughtTolerance', history = [] }) {
  const content = await chatCompletion([
    {
      role: 'system',
      content: [
        'You compare plants for a 3D botanical garden demo.',
        'Answer in two short English sentences for text-to-speech.',
        'Base the comparison only on the provided plant attributes.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        left: slimPlant(left),
        right: slimPlant(right),
        attribute,
        history,
      }),
    },
  ]);
  return content.trim();
}

export async function generateDisambiguationQuestion(candidates) {
  const content = await chatCompletion([
    {
      role: 'system',
      content: [
        'You are speaking directly to a visitor in a botanical garden.',
        'Ask the visitor to choose one visible plant marker.',
        'Mention each marker and plant name exactly as provided.',
        'Do not ask whether the labels are correct.',
        'Do not mention demos, systems, data, placement, configuration, or uncertainty about the marker mapping.',
        'Return one short user-facing sentence suitable for text-to-speech.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({ candidates: candidates.map(({ marker, plant }) => ({ marker, plant: slimPlant(plant) })) }),
    },
  ]);
  return content.trim();
}

async function chatCompletion(messages, { json = false, temperature = 0.2 } = {}) {
  if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY or NEWAPI_API_KEY is not configured.');
  }

  const body = {
    model: config.openai.model,
    messages,
    temperature,
  };
  if (json) body.response_format = { type: 'json_object' };

  const response = await fetch(`${config.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${bodyText}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM response did not include content.');
  return content;
}

function slimPlant(plant) {
  if (!plant) return null;
  return {
    id: plant.id,
    displayName: plant.displayName,
    aliases: plant.aliases,
    description: plant.description,
    medicalInfo: plant.medicalInfo,
    attributes: plant.attributes,
  };
}
