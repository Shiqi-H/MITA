export function parseIntentLocally(text) {
  const normalized = String(text ?? '').trim().toLowerCase();
  if (!normalized) return { intent: 'unknown', confidence: 0.2 };

  if (normalized === 'a' || normalized.includes('option a') || normalized.includes('plant a')) {
    return { intent: 'resolveAmbiguity', marker: 'A', confidence: 0.9 };
  }
  if (normalized === 'b' || normalized.includes('option b') || normalized.includes('plant b')) {
    return { intent: 'resolveAmbiguity', marker: 'B', confidence: 0.9 };
  }
  if (normalized === 'c' || normalized.includes('option c') || normalized.includes('plant c')) {
    return { intent: 'resolveAmbiguity', marker: 'C', confidence: 0.9 };
  }

  if (normalized.includes('more drought tolerant') || normalized.includes('compare')) {
    return {
      intent: 'compare',
      target1: 'currentSelection',
      target2Name: normalized.includes('giant water lily') ? 'giant water lily' : '',
      attribute: 'droughtTolerance',
      confidence: 0.8,
    };
  }

  if (normalized.includes('medicinal') || normalized.includes('medical') || normalized.includes('medicine')) {
    const targetPlantName = extractPlantTarget(normalized);
    return {
      intent: 'queryAttribute',
      referent: targetPlantName || 'currentSelection',
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
