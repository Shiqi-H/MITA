import { generateCompareSpeech } from '../../intent/llmClient.js';
import { speak } from '../../speech/speech.js';
import { renderComparePanel } from '../../ui/comparePanel.js';
import { showSelectionRequiredFallback } from '../../ui/fallbackPanel.js';
import { displayPlant, showInteractionPanel } from '../../ui/panels.js';
import { findPlantByNameOrAlias, findVisitedPlantByNameOrAlias, getDisplayName } from '../selectors.js';
import { setCompareState, state } from '../state.js';
import { resolvePlantReferent } from './shared.js';

export async function handleCompareIntent(parsed, text = '') {
  const left = resolvePlantReferent(parsed.target1 || 'currentSelection', parsed.target1Name || '');
  if (!left) {
    showSelectionRequiredFallback();
    speak('Please select a plant first.');
    return;
  }

  const namedTargetFromText = findPlantByNameOrAlias(text);
  const target2Referent = namedTargetFromText ? 'namedPlant' : parsed.target2Referent || 'previousSelection';
  const targetText = namedTargetFromText ? getDisplayName(namedTargetFromText) : parsed.target2Name || '';
  const right = resolvePlantReferent(target2Referent, targetText);
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

  const note =
    target2Referent === 'previousSelection'
      ? 'Compared with the previously selected plant.'
      : findVisitedPlantByNameOrAlias(targetText)
        ? ''
        : `${getDisplayName(right)} was not in your visited history, so I used the plant database instead.`;

  setCompareState(left.id, right.id);
  displayPlant(left, 'compare');
  renderComparePanel(left, right, attribute, note);
  const generatedSpeech = await generateCompareSpeech({
    left,
    right,
    attribute,
    history: state.conversationHistory.slice(-6),
  });
  speak(generatedSpeech || getCompareFallbackSpeech(left, right));
}

function getCompareFallbackSpeech(left, right) {
  return `${getDisplayName(left)} and ${getDisplayName(right)} are compared by drought tolerance.`;
}
