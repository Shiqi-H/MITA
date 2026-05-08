import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(express.json());

app.post('/api/parse-intent', async (req, res) => {
  const { text = '' } = req.body ?? {};
  const normalized = String(text).toLowerCase();

  // Replace this deterministic parser with a model API call when an API key is available.
  if (normalized.includes('more drought tolerant') || normalized.includes('compare')) {
    res.json({
      intent: 'compare',
      target1: 'currentSelection',
      target2Name: normalized.includes('giant water lily') ? 'giant water lily' : '',
      attribute: 'droughtTolerance',
      confidence: 0.8,
    });
    return;
  }

  if (normalized.includes('medicinal') || normalized.includes('medical') || normalized.includes('medicine')) {
    res.json({
      intent: 'queryAttribute',
      referent: 'currentSelection',
      interest: 'medicinalValue',
      confidence: 0.8,
    });
    return;
  }

  if (normalized === 'a' || normalized === 'b') {
    res.json({ intent: 'resolveAmbiguity', marker: normalized.toUpperCase(), confidence: 0.9 });
    return;
  }

  if (normalized.includes('front') || normalized.includes('back')) {
    res.json({
      intent: 'resolveAmbiguity',
      position: normalized.includes('front') ? 'front' : 'back',
      confidence: 0.8,
    });
    return;
  }

  if (normalized.includes('what is this') || normalized.includes('identify')) {
    res.json({ intent: 'identify', confidence: 0.8 });
    return;
  }

  res.json({ intent: 'unknown', confidence: 0.2 });
});

app.listen(port, () => {
  console.log(`MITA intent server listening on http://localhost:${port}`);
});
