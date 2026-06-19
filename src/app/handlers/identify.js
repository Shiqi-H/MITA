import { speak } from '../../speech/speech.js';
import { getVisiblePlantIds } from '../../scene/visiblePlants.js';
import { els } from '../../ui/dom.js';
import { showSelectionRequiredFallback } from '../../ui/fallbackPanel.js';
import { displayPlant } from '../../ui/panels.js';
import { getCurrentPlant, getPlant } from '../selectors.js';
import { promptAmbiguity } from './ambiguity.js';
import { selectPlantById, speakPlantInfo } from './shared.js';

export async function handleIdentifyIntent(question = '') {
  const currentPlant = getCurrentPlant();
  if (currentPlant) {
    displayPlant(currentPlant);
    await speakPlantInfo(currentPlant, question);
    return;
  }

  const visiblePlantIds = getVisiblePlantIds({
    container: els.container,
    camera: els.scene.camera,
  });

  if (visiblePlantIds.length >= 2) {
    promptAmbiguity(visiblePlantIds);
    return;
  }

  if (visiblePlantIds.length === 1) {
    const plant = getPlant(visiblePlantIds[0]);
    if (plant) {
      selectPlantById(plant.id);
      await speakPlantInfo(plant, question);
    }
    return;
  }

  showSelectionRequiredFallback();
  speak('I cannot see a plant clearly. Please move the view or click a plant.');
}
