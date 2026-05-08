import { parseIntentLocally } from '../services/intentParser.js';

export function compareHandler(req, res) {
  const { text = '' } = req.body ?? {};
  const parsed = parseIntentLocally(text);
  res.json(parsed.intent === 'compare' ? parsed : { intent: 'unknown', confidence: 0.2 });
}
