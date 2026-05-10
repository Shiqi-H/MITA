import intents from '../data/intents.json';
import { normalize } from '../app/selectors.js';

export function parseIntentLocally(text) {
  const normalized = normalize(text);
  if (!normalized) return { intent: 'unknown' };

  const marker = parseMarker(normalized);
  if (marker) {
    return { intent: 'resolveAmbiguity', marker };
  }

  if (matchesAny(normalized, intents.compare)) {
    return {
      intent: 'compare',
      target1: 'currentSelection',
      target2Name: extractCompareTarget(normalized),
      attribute: 'droughtTolerance',
    };
  }

  if (matchesAny(normalized, intents.medical)) {
    const targetPlantName = extractPlantTarget(normalized);
    return {
      intent: 'queryAttribute',
      referent: targetPlantName || 'currentSelection',
      targetPlantName,
      interest: 'medicinalValue',
    };
  }

  if (matchesAny(normalized, intents.unknownInterest)) {
    const targetPlantName = extractPlantTarget(normalized);
    return {
      intent: 'queryAttribute',
      referent: targetPlantName || 'currentSelection',
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

function parseMarker(text) {
  if (text === 'a' || text.includes('option a') || text.includes('plant a')) return 'A';
  if (text === 'b' || text.includes('option b') || text.includes('plant b')) return 'B';
  if (text === 'c' || text.includes('option c') || text.includes('plant c')) return 'C';
  if (text === 'd' || text.includes('option d') || text.includes('plant d')) return 'D';
  return null;
}

function extractCompareTarget(text) {
  return extractPlantTarget(text);
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
