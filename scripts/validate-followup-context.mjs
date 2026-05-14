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
];

for (const [suiteName, parse] of parserSuites) {
  for (const testCase of cases) {
    if (suiteName === 'server' && testCase.skipServer) continue;
    const actual = parse(testCase.text);
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
