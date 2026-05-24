import assert from 'node:assert/strict';
import { parseIntentLocally as parseClientIntent } from '../src/intent/intentParser.js';
import { parseIntentLocally as parseServerIntent } from '../server/services/intentParser.js';

const parserSuites = [
  ['client', parseClientIntent],
  ['server', parseServerIntent],
];

const cases = [
  {
    text: 'What medicinal value does it have?',
    expected: {
      intent: 'queryAttribute',
      referent: 'currentSelection',
      interest: 'medicinalValue',
    },
  },
  {
    text: 'What plant am I looking at?',
    expected: {
      intent: 'identify',
    },
  },
  {
    text: 'How does it compare with the previous one?',
    expected: {
      intent: 'compare',
      target2Referent: 'previousSelection',
      attribute: 'droughtTolerance',
    },
  },
  {
    text: 'Is it more medicinal than the last one?',
    expected: {
      intent: 'compare',
      target2Referent: 'previousSelection',
      attribute: 'unsupported',
    },
  },
  {
    text: 'Compare this one with cactus',
    expected: {
      intent: 'compare',
      target2Referent: 'namedPlant',
      target2Name: 'cactus',
    },
  },
  {
    text: 'Which one has greater height than ginkgo?',
    expected: {
      intent: 'compare',
      target2Referent: 'namedPlant',
      target2Name: 'ginkgo',
      attribute: 'unsupported',
    },
  },
  {
    text: 'Does it have a longer lifespan than lavender?',
    expected: {
      intent: 'compare',
      target2Referent: 'namedPlant',
      target2Name: 'lavender',
      attribute: 'unsupported',
    },
  },
  {
    text: 'What symbolism does it have?',
    expected: {
      intent: 'queryAttribute',
      referent: 'currentSelection',
      interest: 'unknown',
    },
    skipServer: true,
  },
  {
    text: 'option f',
    context: {
      ambiguityCandidates: Array.from({ length: 6 }, (_, index) => ({ marker: String.fromCharCode(65 + index) })),
    },
    expected: {
      intent: 'resolveAmbiguity',
      marker: 'F',
    },
  },
  {
    text: 'plant aa',
    context: {
      ambiguityCandidates: Array.from({ length: 27 }, (_, index) => ({
        marker: index < 26 ? String.fromCharCode(65 + index) : 'AA',
      })),
    },
    expected: {
      intent: 'resolveAmbiguity',
      marker: 'AA',
    },
  },
];

for (const [suiteName, parse] of parserSuites) {
  for (const testCase of cases) {
    if (suiteName === 'server' && testCase.skipServer) continue;
    const actual = parse(testCase.text, testCase.context);
    for (const [key, value] of Object.entries(testCase.expected)) {
      assert.equal(
        actual[key],
        value,
        `${suiteName}: ${testCase.text} expected ${key}=${value}, got ${actual[key]}`,
      );
    }
  }
}

console.log('Follow-up context parser validation passed.');
