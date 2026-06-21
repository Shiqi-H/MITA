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
  compare: ['compare', 'compared to', 'compared with', 'how does it compare', 'how do they compare'],
  medical: ['medicinal value', 'medical', 'medicine', 'medicinal', 'herbal use'],
  droughtTolerance: ['drought tolerance', 'drought tolerant', 'drought-resistant', 'drought resistant'],
  height: ['height', 'how tall', 'tall'],
  lifespan: ['lifespan', 'life span', 'how long does it live', 'live longer', 'lives longer', 'long-lived'],
  unknownInterest: ['feng shui', 'symbolism', 'spiritual', 'toxicity', 'toxic'],
};

function normalize(text) {
  return String(text ?? '').trim().toLowerCase();
}

export function parseIntentLocally(text, context = {}) {
  const normalized = normalize(text);
  if (!normalized) return { intent: 'unknown' };

  const marker = parseMarker(normalized, context);
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

  const attributeInterest = getAttributeInterest(normalized);
  if (attributeInterest) {
    const targetPlantName = extractPlantTarget(normalized);
    const referent = getAttributeReferent(normalized, targetPlantName);
    return {
      intent: 'queryAttribute',
      referent,
      targetPlantName,
      interest: attributeInterest,
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
    text.includes('what about compared to') ||
    text.includes('what about compared with') ||
    (text.includes('than') && hasComparisonCue(text)) ||
    (hasComparatorCue(text) && hasAttributeCue(text))
  );
}

function hasComparisonCue(text) {
  return [
    'more',
    'less',
    'better',
    'worse',
    'greater',
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

function hasComparatorCue(text) {
  return [
    'more',
    'less',
    'better',
    'worse',
    'greater',
    'taller',
    'shorter',
    'longer',
  ].some((cue) => text.includes(cue));
}

function hasAttributeCue(text) {
  return Boolean(getAttributeInterest(text));
}

function parseMarker(text, context = {}) {
  const markers = getAllowedMarkers(context);
  return markers.find((marker) => {
    const normalizedMarker = marker.toLowerCase();
    return (
      text === normalizedMarker ||
      markerPhraseMatches(text, 'option', normalizedMarker) ||
      markerPhraseMatches(text, 'plant', normalizedMarker)
    );
  }) ?? null;
}

function markerPhraseMatches(text, prefix, marker) {
  return new RegExp(`\\b${prefix}\\s+${marker}\\b`).test(text);
}

function getAllowedMarkers(context = {}) {
  const candidates = Array.isArray(context.ambiguityCandidates) ? context.ambiguityCandidates : [];
  if (!candidates.length) return ['A', 'B', 'C', 'D'];

  return candidates
    .map((candidate, index) => candidate.marker || getMarkerForIndex(index))
    .sort((left, right) => right.length - left.length);
}

export function getMarkerForIndex(index) {
  let cursor = index + 1;
  let marker = '';
  while (cursor > 0) {
    cursor -= 1;
    marker = String.fromCharCode(65 + (cursor % 26)) + marker;
    cursor = Math.floor(cursor / 26);
  }
  return marker;
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
    return 'medicinalValue';
  }
  if (
    text.includes('height') ||
    text.includes('tall') ||
    text.includes('taller') ||
    text.includes('shorter')
  ) {
    return 'height';
  }
  if (
    text.includes('lifespan') ||
    text.includes('life span') ||
    text.includes('live longer') ||
    text.includes('lives longer') ||
    text.includes('long-lived') ||
    text.includes('longer')
  ) {
    return 'lifespan';
  }
  return 'droughtTolerance';
}

function getAttributeInterest(text) {
  if (matchesAny(text, intents.medical)) return 'medicinalValue';
  if (matchesAny(text, intents.droughtTolerance)) return 'droughtTolerance';
  if (matchesAny(text, intents.height)) return 'height';
  if (matchesAny(text, intents.lifespan)) return 'lifespan';
  return '';
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
