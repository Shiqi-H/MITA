import { generateInfoSpeech } from '../../intent/llmClient.js';
import { speak } from '../../speech/speech.js';
import { showUnsupportedInterestFallback } from '../../ui/fallbackPanel.js';
import { clearFallbackActions, displayPlant } from '../../ui/panels.js';
import { findPlantByNameOrAlias, getDisplayName } from '../selectors.js';
import { resetVoiceFailures, state } from '../state.js';
import { requestPlantForPendingQuery } from './pendingPlantQuery.js';
import { resolvePlantReferent } from './shared.js';

const KNOWN_ATTRIBUTE_LABELS = {
  droughtTolerance: 'drought tolerance',
  height: 'height',
  lifespan: 'lifespan',
  medicinalValue: 'medicinal value',
};

export async function handleAttributeIntent(parsed, text = '') {
  const plant = resolveAttributeTarget(parsed, text);
  if (!plant) {
    requestPlantForPendingQuery({ intent: 'queryAttribute', parsed, text });
    return;
  }

  if (isKnownAttributeInterest(parsed.interest)) {
    resetVoiceFailures();
    clearFallbackActions();
    displayPlant(plant);
    const generatedSpeech = await generateInfoSpeech({
      plant,
      question: text,
      interest: parsed.interest,
      history: state.conversationHistory.slice(-6),
    });
    speak(generatedSpeech || getAttributeFallbackSpeech(plant, parsed.interest));
    return;
  }

  showUnsupportedAttributeFallback(plant, parsed, text);
}

function showUnsupportedAttributeFallback(plant, parsed, text) {
  showUnsupportedInterestFallback({
    onMedical: () => handleAttributeIntent({ ...parsed, interest: 'medicinalValue' }, text),
    onBotanical: () => {
      displayPlant(plant);
      speak(`${getDisplayName(plant)} botanical features are shown.`);
    },
  });
  speak('I do not have that information. I can show medicinal value or botanical features.');
}

function isKnownAttributeInterest(interest) {
  return Object.hasOwn(KNOWN_ATTRIBUTE_LABELS, interest);
}

function getAttributeFallbackSpeech(plant, interest) {
  const label = KNOWN_ATTRIBUTE_LABELS[interest];
  const value = plant.attributes?.[interest];
  if (value) return `${getDisplayName(plant)} ${label}: ${value}.`;
  return `${getDisplayName(plant)} ${label} information is shown.`;
}

function resolveAttributeTarget(parsed, text) {
  const parsedTarget = parsed.targetPlantName ? findPlantByNameOrAlias(parsed.targetPlantName) : null;
  if (parsedTarget) return parsedTarget;
  const textTarget = findPlantByNameOrAlias(text);
  if (textTarget) return textTarget;
  return resolvePlantReferent(parsed.referent || 'currentSelection', parsed.targetPlantName || '');
}
