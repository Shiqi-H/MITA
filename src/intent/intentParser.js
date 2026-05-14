const intents = {
  identify: [
    'what is this',
    'what plant is this',
    'identify this',
    'show this plant',
    'what am i looking at',
    'what plant am i looking at',
    'what is in front of me',
    'tell me about this plant',
  ],
  compare: ['compare', 'more drought tolerant', 'drought tolerance', 'than the giant water lily'],
  medical: ['medicinal value', 'medical', 'medicine', 'medicinal', 'herbal use'],
  unknownInterest: ['feng shui', 'symbolism', 'spiritual'],
};

function normalize(text) {
  return String(text ?? '').trim().toLowerCase();
}

export function parseIntentLocally(text) {
  const normalized = normalize(text);
  if (!normalized) return { intent: 'unknown' };

  const marker = parseMarker(normalized);
  if (marker) {
    return { intent: 'resolveAmbiguity', marker };
  }

  if (isCompareIntent(normalized)) {
    const target2Referent = getCompareReferent(normalized);
    return {
      intent: 'compare',
      target1: 'currentSelection',
      target2Referent,
      target2Name: target2Referent === 'namedPlant' ? extractPlantTarget(normalized) : '',
      attribute: getComparisonAttribute(normalized),
    };
  }

  if (matchesAny(normalized, intents.medical)) {
    const targetPlantName = extractPlantTarget(normalized);
    const referent = getAttributeReferent(normalized, targetPlantName);
    return {
      intent: 'queryAttribute',
      referent,
      targetPlantName,
      interest: 'medicinalValue',
    };
  }

  if (matchesAny(normalized, intents.unknownInterest)) {
    const targetPlantName = extractPlantTarget(normalized);
    const referent = getAttributeReferent(normalized, targetPlantName);
    return {
      intent: 'queryAttribute',
      referent,
      targetPlantName,
      interest: 'unknown',
    };
  }

  if (matchesAny(normalized, intents.identify)) {
    return { intent: 'identify' };
  }

  return { intent: 'unknown' };
}

function matchesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function isCompareIntent(text) {
  if (matchesAny(text, intents.compare)) return true;
  return (
    text.includes('compared to') ||
    text.includes('compared with') ||
    text.includes('compare it with') ||
    text.includes('compare this one with') ||
    text.includes('compare that plant with') ||
    text.includes('how does it compare') ||
    text.includes('how do they compare') ||
    text.includes('what about compared to') ||
    text.includes('what about compared with') ||
    (text.includes('than') && hasComparisonCue(text))
  );
}

function hasComparisonCue(text) {
  return [
    'more',
    'less',
    'better',
    'worse',
    'taller',
    'shorter',
    'longer',
    'medicinal',
    'medical',
    'drought',
    'height',
    'lifespan',
  ].some((cue) => text.includes(cue));
}

function parseMarker(text) {
  if (text === 'a' || text.includes('option a') || text.includes('plant a')) return 'A';
  if (text === 'b' || text.includes('option b') || text.includes('plant b')) return 'B';
  if (text === 'c' || text.includes('option c') || text.includes('plant c')) return 'C';
  if (text === 'd' || text.includes('option d') || text.includes('plant d')) return 'D';
  return null;
}

function getCompareReferent(text) {
  if (
    text.includes('previous') ||
    text.includes('last') ||
    text.includes('the one before') ||
    text.includes('previous one') ||
    text.includes('last one') ||
    text.includes('the previous plant') ||
    text.includes('previously selected') ||
    text.includes('last selected')
  ) {
    return 'previousSelection';
  }
  return extractPlantTarget(text) ? 'namedPlant' : 'previousSelection';
}

function getAttributeReferent(text, targetPlantName) {
  if (targetPlantName) return 'namedPlant';
  if (
    text.includes('previous') ||
    text.includes('last one') ||
    text.includes('the one before') ||
    text.includes('the previous plant')
  ) {
    return 'previousSelection';
  }
  return 'currentSelection';
}

function getComparisonAttribute(text) {
  if (
    text.includes('medicinal') ||
    text.includes('medical') ||
    text.includes('medicine') ||
    text.includes('herbal')
  ) {
    return 'unsupported';
  }
  if (
    text.includes('height') ||
    text.includes('tall') ||
    text.includes('taller') ||
    text.includes('shorter')
  ) {
    return 'unsupported';
  }
  if (
    text.includes('lifespan') ||
    text.includes('life span') ||
    text.includes('live longer') ||
    text.includes('lives longer') ||
    text.includes('long-lived')
  ) {
    return 'unsupported';
  }
  return 'droughtTolerance';
}

function extractPlantTarget(text) {
  if (text.includes('giant water lily') || text.includes('water lily') || text.includes('lotus')) {
    return 'giant water lily';
  }
  if (text.includes('cactus')) return 'cactus';
  if (text.includes('ginkgo')) return 'ginkgo';
  if (text.includes('lavender') || text.includes('lavandula')) return 'lavender';
  if (text.includes('fern') || text.includes('nephrolepis')) return 'nephrolepis';
  if (text.includes('santolina')) return 'santolina';
  return '';
}
