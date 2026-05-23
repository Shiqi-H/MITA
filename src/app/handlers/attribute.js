import { generateInfoSpeech } from '../../intent/llmClient.js';
import { speak } from '../../speech/speech.js';
import { showSelectionRequiredFallback, showUnsupportedInterestFallback } from '../../ui/fallbackPanel.js';
import { renderMedicalPanel } from '../../ui/medicalPanel.js';
import { clearFallbackActions, displayPlant } from '../../ui/panels.js';
import { findPlantByNameOrAlias, getDisplayName } from '../selectors.js';
import { resetVoiceFailures, state } from '../state.js';
import { resolvePlantReferent } from './shared.js';

export async function handleAttributeIntent(parsed, text = '') {
  const plant = resolveAttributeTarget(parsed, text);
  if (!plant) {
    showSelectionRequiredFallback();
    speak('Please select a plant first.');
    return;
  }

  if (parsed.interest === 'medicinalValue') {
    resetVoiceFailures();
    clearFallbackActions();
    displayPlant(plant, 'medical');
    renderMedicalPanel(plant);
    const generatedSpeech = await generateInfoSpeech({
      plant,
      question: 'What is the medicinal value of this plant?',
      interest: parsed.interest,
      history: state.visitedPlantIds,
    });
    speak(generatedSpeech || `${getDisplayName(plant)} medicinal value: ${plant.medicalInfo}`);
    return;
  }

  showUnsupportedInterestFallback({
    onMedical: () => handleAttributeIntent({ ...parsed, interest: 'medicinalValue' }, text),
    onBotanical: () => {
      displayPlant(plant);
      speak(`${getDisplayName(plant)} botanical features are shown.`);
    },
  });
  speak('I do not have that information. I can show medicinal value or botanical features.');
}

function resolveAttributeTarget(parsed, text) {
  const parsedTarget = parsed.targetPlantName ? findPlantByNameOrAlias(parsed.targetPlantName) : null;
  if (parsedTarget) return parsedTarget;
  const textTarget = findPlantByNameOrAlias(text);
  if (textTarget) return textTarget;
  return resolvePlantReferent(parsed.referent || 'currentSelection', parsed.targetPlantName || '');
}
