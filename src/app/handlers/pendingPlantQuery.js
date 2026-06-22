import { getVisiblePlantIds } from '../../scene/visiblePlants.js';
import { speak } from '../../speech/speech.js';
import { els } from '../../ui/dom.js';
import { showPendingPlantSelectionFallback } from '../../ui/fallbackPanel.js';
import { setPendingPlantQuery } from '../state.js';
import { promptAmbiguity } from './ambiguity.js';
import { selectPlantById } from './shared.js';

export function requestPlantForPendingQuery(query) {
  setPendingPlantQuery(query);

  const visiblePlantIds = getVisiblePlantIds({
    container: els.container,
    camera: els.scene.camera,
  });

  if (visiblePlantIds.length >= 2) {
    promptAmbiguity(visiblePlantIds, { pendingQuestion: query.text });
    return;
  }

  if (visiblePlantIds.length === 1) {
    selectPlantById(visiblePlantIds[0]);
    return;
  }

  showPendingPlantSelectionFallback(query.text);
  speak('Select a plant to answer your question.');
}
