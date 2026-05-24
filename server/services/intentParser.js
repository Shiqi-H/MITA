export function parseIntentLocally(text, context = {}) {
  const normalized = String(text ?? '').trim().toLowerCase();
  if (!normalized) return { intent: 'unknown', confidence: 0.2 };

  const marker = parseMarker(normalized, context);
  if (marker) {
    return { intent: 'resolveAmbiguity', marker, confidence: 0.9 };
  }

  if (isCompareIntent(normalized)) {
    const target2Referent = getCompareReferent(normalized);
    return {
      intent: 'compare',
      target1: 'currentSelection',
      target2Referent,
      target2Name: target2Referent === 'namedPlant' ? extractPlantTarget(normalized) : '',
      attribute: getComparisonAttribute(normalized),
      confidence: 0.8,
    };
  }

  if (normalized.includes('medicinal') || normalized.includes('medical') || normalized.includes('medicine')) {
    const targetPlantName = extractPlantTarget(normalized);
    return {
      intent: 'queryAttribute',
      referent: getAttributeReferent(normalized, targetPlantName),
      targetPlantName,
      interest: 'medicinalValue',
      confidence: 0.8,
    };
  }

  if (
    normalized.includes('what is this') ||
    normalized.includes('what plant is this') ||
    normalized.includes('identify') ||
    normalized.includes('show this plant') ||
    normalized.includes('what am i looking at') ||
    normalized.includes('what plant am i looking at') ||
    normalized.includes('what is in front of me') ||
    normalized.includes('tell me about this plant')
  ) {
    return { intent: 'identify', confidence: 0.8 };
  }

  return { intent: 'unknown', confidence: 0.2 };
}

function isCompareIntent(text) {
  return (
    text.includes('more drought tolerant') ||
    text.includes('drought tolerance') ||
    text.includes('compare') ||
    text.includes('compared to') ||
    text.includes('compared with') ||
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

function getMarkerForIndex(index) {
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
