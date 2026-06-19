import { generateDisambiguationQuestion, generateInfoResponse, generateSceneResponse, parseIntentWithLlm } from '../services/llm.js';
import { parseIntentLocally } from '../services/intentParser.js';

export async function queryHandler(req, res) {
  const { text = '', context = {} } = req.body ?? {};

  try {
    const intent = await parseIntentWithLlm({ text, context });
    res.json({ ...intent, source: 'llm' });
  } catch (error) {
    console.warn(error.message);
    res.json({
      ...parseIntentLocally(text, context),
      source: 'local',
      parserFallback: 'local',
    });
  }
}

export async function infoHandler(req, res) {
  const { plant, question = '', interest = '', history = [] } = req.body ?? {};
  if (!plant) {
    res.json({ speech: '' });
    return;
  }

  try {
    const speech = await generateInfoResponse({ plant, question, interest, history });
    res.json({ speech, source: 'llm' });
  } catch (error) {
    console.warn(error.message);
    res.json({ speech: '', source: 'fallback', error: error.message });
  }
}

export async function sceneHandler(req, res) {
  const { plants = [], question = '', history = [], gardenSummary = [], currentScene = '' } = req.body ?? {};
  try {
    const speech = await generateSceneResponse({ plants, question, history, gardenSummary, currentScene });
    res.json({ speech, source: 'llm' });
  } catch (error) {
    console.warn(error.message);
    res.json({ speech: '', source: 'fallback', error: error.message });
  }
}

export async function disambiguationHandler(req, res) {
  const { candidates = [] } = req.body ?? {};
  try {
    const speech = await generateDisambiguationQuestion(candidates);
    res.json({ speech, source: 'llm' });
  } catch (error) {
    console.warn(error.message);
    res.json({ speech: '', source: 'fallback', error: error.message });
  }
}
