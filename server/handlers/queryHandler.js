import { parseIntentWithLlm } from '../services/llm.js';
import { parseIntentLocally } from '../services/intentParser.js';

export async function queryHandler(req, res) {
  const { text = '', context = {} } = req.body ?? {};

  try {
    const intent = await parseIntentWithLlm({ text, context });
    res.json({ ...intent, source: 'llm' });
  } catch (error) {
    console.warn(error.message);
    res.json({
      ...parseIntentLocally(text),
      source: 'local',
      parserFallback: 'local',
    });
  }
}
