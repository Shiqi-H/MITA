import { parseIntentLocally } from '../services/intentParser.js';

export function clarifyHandler(req, res) {
  const { text = '' } = req.body ?? {};
  const parsed = parseIntentLocally(text);
  res.json(parsed.intent === 'resolveAmbiguity' ? parsed : { intent: 'unknown', confidence: 0.2 });
}
