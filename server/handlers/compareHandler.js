import { generateCompareResponse } from '../services/llm.js';
import { parseIntentLocally } from '../services/intentParser.js';

export async function compareHandler(req, res) {
  const { text = '', left = null, right = null, attribute = 'droughtTolerance', history = [] } = req.body ?? {};
  if (left && right) {
    try {
      const speech = await generateCompareResponse({ left, right, attribute, history });
      res.json({ speech, source: 'llm' });
      return;
    } catch (error) {
      console.warn(error.message);
      res.json({ speech: '', source: 'fallback', error: error.message });
      return;
    }
  }

  const parsed = parseIntentLocally(text);
  res.json(parsed.intent === 'compare' ? parsed : { intent: 'unknown', confidence: 0.2 });
}
