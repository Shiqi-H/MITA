import { config } from '../config.js';
import { getPlantContext } from './plantDb.js';

const RESPONSE_SCHEMA = {
  intent: 'identify | resolveAmbiguity | compare | queryAttribute | unknown',
  marker: 'A | B | C when resolving ambiguity',
  target1: 'currentSelection when comparing',
  target2Referent: 'previousSelection when comparing against the previous or last selected plant, or when no second named plant is provided; namedPlant when comparing against a plant name',
  target2Name: 'plant name when comparing',
  attribute: 'droughtTolerance | height | lifespan | medicinalValue | or any other plant attribute the user asks about',
  referent: 'currentSelection when querying selected plant, previousSelection when querying the previous or last plant, or namedPlant when user names a plant',
  targetPlantName: 'plant name when querying an attribute of a named plant',
  interest: 'droughtTolerance | height | lifespan | medicinalValue | unknown',
  confidence: 'number from 0 to 1',
};

export async function parseIntentWithLlm({ text, context }) {
  const content = await chatCompletion(
    [
      {
        role: 'system',
        content: [
          'You parse user utterances for a 3D botanical garden demo.',
          'Understand English utterances only; do not infer non-English intent.',
          'Return only JSON. Do not include markdown.',
          'Classify referential questions such as "what is this", "what plant is this", "what am I looking at", "what is in front of me", and "tell me about this plant" as intent "identify".',
          'For attribute questions about "it", "this one", "that plant", or "the selected plant", set referent to "currentSelection".',
          'For attribute questions about "previous one", "last one", "the one before", or "the previous plant", set referent to "previousSelection".',
          'For known plant attribute questions, return intent "queryAttribute" and set interest to exactly one of: droughtTolerance, height, lifespan, medicinalValue.',
          'Treat questions about medicinal value, medical use, medicine, or herbal use as interest "medicinalValue".',
          'For unsupported attribute or interest questions such as toxicity, feng shui, symbolism, or spiritual meaning, return intent "queryAttribute" with interest "unknown".',
          'For comparisons, classify phrases such as "previous", "last", "the one before", "previously selected", "last selected", or comparisons without a named second plant as target2Referent "previousSelection".',
          'For comparisons against a named plant, set target2Referent to "namedPlant" and put the plant name in target2Name.',
          'For comparisons, set attribute to the specific attribute the user asks about (droughtTolerance, height, lifespan, medicinalValue, etc.). Default to "droughtTolerance" only when the user does not specify an attribute.',
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
  const parsed = JSON.parse(stripMarkdownJson(content));
  if (!parsed || typeof parsed.intent !== 'string') {
    throw new Error('LLM response did not include an intent.');
  }
  return parsed;
}

export async function generateInfoResponse({ plant, question = '', interest = '', history = [] }) {
  const slim = slimPlant(plant);
  const historyText = history.slice(-6).join('\n');
  const content = await chatCompletion([
    {
      role: 'system',
      content: [
        'You are the spoken guide for a concise 3D botanical garden demo.',
        'Answer in one or two natural English sentences for text-to-speech.',
        'Use the provided plant data as your primary source. When the data is incomplete or missing a field, supplement with your own botanical knowledge to give a helpful answer.',
        `The selected plant is "${slim?.displayName ?? 'unknown'}".`,
        `Its key attributes: ${JSON.stringify(slim?.attributes ?? {})}.`,
        slim?.description ? `Description: ${slim.description}` : null,
        slim?.medicalInfo ? `Medicinal info: ${slim.medicalInfo}` : null,
        historyText ? `Recent conversation:\n${historyText}` : null,
      ].filter(Boolean).join('\n'),
    },
    {
      role: 'user',
      content: question || interest || 'Tell me about this plant.',
    },
  ]);
  return content.trim();
}

export async function generateCompareResponse({ left, right, attribute = 'droughtTolerance', history = [] }) {
  const slimLeft = slimPlant(left);
  const slimRight = slimPlant(right);
  const historyText = history.slice(-6).join('\n');
  const content = await chatCompletion([
    {
      role: 'system',
      content: [
        'You compare plants for a 3D botanical garden demo.',
        'Answer in two short English sentences for text-to-speech.',
        'Use the provided plant data as your primary source for comparison. When specific values are missing, supplement with your botanical knowledge to give a meaningful answer.',
        `Compare "${slimLeft?.displayName}" vs "${slimRight?.displayName}" on: ${attribute}.`,
        `${slimLeft?.displayName} data: ${JSON.stringify(slimLeft?.attributes)}.`,
        `${slimRight?.displayName} data: ${JSON.stringify(slimRight?.attributes)}.`,
        'If the attribute is not in the data, say so and mention what you can compare instead.',
        historyText ? `Recent conversation:\n${historyText}` : null,
      ].filter(Boolean).join('\n'),
    },
    {
      role: 'user',
      content: `Compare ${attribute}.`,
    },
  ]);
  return content.trim();
}

export async function generateSceneResponse({ plants, question = '', history = [], gardenSummary = [], currentScene = '' }) {
  const historyText = history.slice(-6).join('\n');
  const plantList = plants.map((p) => slimPlant(p));
  const totalPlants = gardenSummary.reduce((sum, s) => sum + s.plants.length, 0);
  const content = await chatCompletion([
    {
      role: 'system',
      content: [
        'You are the spoken guide for a concise 3D botanical garden demo.',
        'Answer in one or two natural English sentences for text-to-speech.',
        'Use the provided plant data as your primary source. When data is incomplete, supplement with your botanical knowledge.',
        currentScene ? `The visitor is currently in ${currentScene}.` : null,
        `Plants in this scene: ${JSON.stringify(plantList)}.`,
        gardenSummary.length > 0
          ? `Full garden across all scenes (${totalPlants} plants total): ${JSON.stringify(gardenSummary)}.`
          : null,
        historyText ? `Recent conversation:\n${historyText}` : null,
      ].filter(Boolean).join('\n'),
    },
    {
      role: 'user',
      content: question || 'Tell me about the plants in this scene.',
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
  if (!config.llm.apiKey) {
    throw new Error('LLM API key is not configured.');
  }

  const body = {
    model: config.llm.model,
    messages,
    temperature,
  };
  if (json) body.response_format = { type: 'json_object' };

  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`,
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

function stripMarkdownJson(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
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
