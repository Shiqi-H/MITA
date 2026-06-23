import { generateCompareSpeech } from '../../intent/llmClient.js';
import { speak } from '../../speech/speech.js';
import { renderComparePanel } from '../../ui/comparePanel.js';
import { displayPlant, showInteractionPanel } from '../../ui/panels.js';
import { findPlantByNameOrAlias, getDisplayName, getLastVisitedPlant } from '../selectors.js';
import { setCompareState, state } from '../state.js';
import { requestPlantForPendingQuery } from './pendingPlantQuery.js';
import { resolvePlantReferent } from './shared.js';

const ATTRIBUTE_LABELS = {
  droughtTolerance: 'drought tolerance',
  height: 'height',
  lifespan: 'lifespan',
  medicinalValue: 'medicinal value',
};

export async function handleCompareIntent(parsed, text = '') {
  const namedTargetFromText = findPlantByNameOrAlias(text);
  const target2Referent = namedTargetFromText ? 'namedPlant' : parsed.target2Referent || 'previousSelection';
  const targetText = namedTargetFromText ? getDisplayName(namedTargetFromText) : parsed.target2Name || '';
  const right = resolvePlantReferent(target2Referent, targetText);
  const left = resolveCompareLeft(parsed, right);
  if (!left) {
    requestPlantForPendingQuery({ intent: 'compare', parsed, text });
    return;
  }

  const attribute = parsed.attribute || 'droughtTolerance';

  if (!right) {
    if (target2Referent === 'previousSelection') {
      showInteractionPanel(
        'Previous plant not found',
        'Please select at least two different plants before comparing with the previous selection.',
      );
      speak('Please select at least two different plants before comparing with the previous selection.');
      return;
    }

    showInteractionPanel(
      'Comparison target not found',
      `I could not find ${targetText}. Please select another plant or use a known plant name.`,
    );
    speak(`I could not find ${targetText}.`);
    return;
  }

  if (left.id === right.id) {
    showInteractionPanel(
      'Comparison target is the same plant',
      `Please choose a different plant to compare with ${getDisplayName(right)}.`,
    );
    speak(`Please choose a different plant to compare with ${getDisplayName(right)}.`);
    return;
  }

  setCompareState(left.id, right.id);
  displayPlant(left);
  renderComparePanel(left, right, attribute);
  const generatedSpeech = await generateCompareSpeech({
    left,
    right,
    attribute,
    history: state.conversationHistory.slice(-6),
  });
  speak(generatedSpeech || getCompareFallbackSpeech(left, right, attribute));
}

function getCompareFallbackSpeech(left, right, attribute = 'droughtTolerance') {
  const label = ATTRIBUTE_LABELS[attribute] || attribute || ATTRIBUTE_LABELS.droughtTolerance;
  return `${getDisplayName(left)} and ${getDisplayName(right)} are compared by ${label}.`;
}

function resolveCompareLeft(parsed, right) {
  const left = resolvePlantReferent(parsed.target1 || 'currentSelection', parsed.target1Name || '');
  if (!left) return null;
  if (!right || left.id !== right.id) return left;
  return getLastVisitedPlant(right.id);
}
