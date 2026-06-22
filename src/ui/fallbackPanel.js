import { setFallbackActions, showInteractionPanel } from './panels.js';

export function showSelectionRequiredFallback() {
  showInteractionPanel('Select a plant first', 'Please select a plant in the scene before asking for a focused attribute.');
}

export function showPendingPlantSelectionFallback(question) {
  showInteractionPanel(
    'Select a plant to answer',
    `Select a plant to answer: ${question}`,
  );
}

export function showUnsupportedInterestFallback({ onMedical, onBotanical }) {
  showInteractionPanel(
    'Information not available',
    'I do not have that information. I can show medicinal value or botanical features.',
  );
  setFallbackActions([
    { label: 'Medicinal value', onClick: onMedical },
    { label: 'Botanical features', onClick: onBotanical },
  ]);
}
