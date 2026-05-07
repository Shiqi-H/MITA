const SCENES = {
    'scene-1': {
        title: 'Scene 1',
        panorama: '/scene-1.jpg',
        links: [
            { target: 'scene-2', pos: '1 -1 -3', rot: '-90 -20 0' },
            { target: 'scene-3', pos: '-1 -1 3', rot: '-90 160 0' }
        ],
        models: [
            { 
                id: 'lavender', 
                src: 'Lavandula/Lavandula.glb',
                name: 'Lavandula', 
                pos: '3 -1 2', 
                scale: '4 4 4'
            },
            {
                id: 'Nephrolepis',
                src: 'Nephrolepis/Nephrolepis.glb',
                name: 'Nephrolepis',
                pos: '3 -1 4',
                scale: '4 4 4'
            },
            {
                id: 'Santolina',
                src: 'Santolina/Santolina.glb',
                name: 'Santolina',
                pos: '3 -1 0',
                scale: '4 4 4'
            }
        ]
    },
    'scene-2': {
        title: 'Scene 2',
        panorama: '/scene-2.jpg',
        links: [
            { target: 'scene-1', pos: '3 -1 -1', rot: '-90 -30 0' },
            { target: 'scene-4', pos: '3 -1 1', rot: '-90 -120 0' }
        ],
        models: []
    },
    'scene-3': {
        title: 'Scene 3',
        panorama: '/scene-3.jpg',
        links: [
            { target: 'scene-1', pos: '3 -1 0', rot: '-90 -120 0' }
        ],
        models: []
    },
    'scene-4': {
        title: 'Scene 4',
        panorama: '/scene-4.jpg',
        links: [
            { target: 'scene-2', pos: '3 -1 0', rot: '-90 -120 0' },
            { target: 'scene-5', pos: '3 -1 -2', rot: '-90 -60 0' }
        ],
        models: []
    },
    'scene-5': {
        title: 'Scene 5',
        panorama: '/scene-5.jpg',
        links: [
            { target: 'scene-4', pos: '-3 -1 -1', rot: '-90 70 0' }
        ],
        models: []
    }
};

import './style.css';
import { wsClient } from './ws-client.js';
import { STTController, speak } from './speech.js';
import { showDisambiguationOverlay, hideDisambiguationOverlay } from './ui/overlay.js';
import { highlightPlant, unhighlightPlant, clearAllHighlights } from './ui/highlight.js';
import { renderInfoCard, renderComparisonCard, renderFallbackCard, closeCard } from './ui/cards.js';

// ─────────────────────────────────────────────
// Session state
// ─────────────────────────────────────────────

/** @type {Array<{plantId: string, plantName: string, timestamp: number}>} */
const visitedPlants = [];

/** Last raycaster hits (IDs) and their 3D positions */
let lastHits = [];
let lastHitPositions = {};

/** Track retried clarification attempts */
let clarifyRetryCount = 0;
const MAX_CLARIFY_RETRIES = 2;

// ─────────────────────────────────────────────
// STT Controller
// ─────────────────────────────────────────────

let pendingTranscript = '';

const stt = new STTController({
    lang: 'zh-CN',
    onResult(transcript, isFinal) {
        pendingTranscript = transcript;
        updateMicLabel(transcript);
        if (isFinal) {
            onVoiceInput(transcript);
            pendingTranscript = '';
        }
    },
    onStart() { micBtn?.classList.add('mic--active'); },
    onEnd()   { micBtn?.classList.remove('mic--active'); updateMicLabel(''); },
    onError(e) {
        console.warn('[stt] error:', e.error);
        updateMicLabel('语音识别失败，请重试');
    },
});

// ─────────────────────────────────────────────
// WebSocket response handlers
// ─────────────────────────────────────────────

wsClient.on('disambiguate', (msg) => {
    clearAllHighlights();
    clarifyRetryCount = 0;
    // Highlight each candidate
    msg.candidates.forEach((c) => highlightPlant(c.id));
    // Show overlay with click-to-select buttons
    showDisambiguationOverlay(msg.candidates, (selectedId) => {
        clearAllHighlights();
        wsClient.send({ type: 'clarify', selectedId }, visitedPlants);
    });
    speak(msg.speech);
});

wsClient.on('response', (msg) => {
    hideDisambiguationOverlay();
    clearAllHighlights();
    highlightPlant(msg.plantId);
    renderInfoCard(msg.cardType, msg.data);
    speak(msg.speech);
    // Record visit
    if (msg.data?.id && msg.data?.name) {
        recordVisit(msg.data.id, msg.data.name);
    }
});

wsClient.on('comparison', (msg) => {
    hideDisambiguationOverlay();
    clearAllHighlights();
    renderComparisonCard(msg.plant1, msg.plant2, msg.slot);
    speak(msg.speech);
});

wsClient.on('fallback', (msg) => {
    hideDisambiguationOverlay();
    clearAllHighlights();
    renderFallbackCard(msg, (slot) => {
        // User chose an alternative slot from the fallback card
        wsClient.send(
            { type: 'query', hits: lastHits, hitPositions: lastHitPositions, text: `我想了解${slotToText(slot)}` },
            visitedPlants
        );
        closeCard();
    });
    speak(msg.speech);
});

wsClient.on('clarify_retry', (msg) => {
    clarifyRetryCount++;
    speak(msg.speech);
    if (clarifyRetryCount >= MAX_CLARIFY_RETRIES) {
        // Surface click-button overlay as final fallback
        // (overlay was already shown on first disambiguate; just re-speak the hint)
        speak('请直接点击屏幕上的按钮来选择植物。');
    }
});

wsClient.on('error', (msg) => {
    hideDisambiguationOverlay();
    clearAllHighlights();
    console.error('[ws] Server error:', msg.speech);
    speak(msg.speech);
});

// ─────────────────────────────────────────────
// Voice input handler — called after STT final result
// ─────────────────────────────────────────────

function onVoiceInput(text) {
    if (!text.trim()) return;

    // If disambiguation is active (pending candidates), send a clarify message
    const overlay = document.getElementById('mita-disambig-overlay');
    if (overlay) {
        wsClient.send({ type: 'clarify', text }, visitedPlants);
        return;
    }

    // Otherwise, send a query with the last known hits
    if (lastHits.length === 0) {
        speak('请先点击一株植物，再提问。');
        return;
    }

    wsClient.send(
        { type: 'query', hits: lastHits, hitPositions: lastHitPositions, text },
        visitedPlants
    );
}

// ─────────────────────────────────────────────
// Raycaster hit extraction from A-Frame
// ─────────────────────────────────────────────

/**
 * Extract 3D positions from A-Frame intersection detail.
 * Returns { ids: string[], positions: {[id]: {x,y,z}} }
 */
function extractHits(intersections) {
    const ids = [];
    const positions = {};
    for (const hit of intersections) {
        const el = hit.object.el;
        if (!el) continue;
        const id = el.id;
        if (!id || el.classList.contains('nav-arrow')) continue;
        ids.push(id);
        const pos = el.object3D?.position ?? hit.point ?? { x: 0, y: 0, z: 0 };
        positions[id] = { x: pos.x, y: pos.y, z: pos.z };
    }
    return { ids, positions };
}

// ─────────────────────────────────────────────
// Visited plants tracking
// ─────────────────────────────────────────────

function recordVisit(plantId, plantName) {
    const existing = visitedPlants.findIndex((v) => v.plantId === plantId);
    if (existing !== -1) visitedPlants.splice(existing, 1);
    visitedPlants.unshift({ plantId, plantName, timestamp: Date.now() });
}

// ─────────────────────────────────────────────
// Mic button UI
// ─────────────────────────────────────────────

let micBtn = null;

function createMicButton() {
    micBtn = document.createElement('button');
    micBtn.id = 'mita-mic-btn';
    micBtn.title = '按住说话';
    micBtn.innerHTML = '🎤';
    micBtn.addEventListener('click', () => stt.toggle());
    document.body.appendChild(micBtn);
}

function updateMicLabel(text) {
    if (!micBtn) return;
    micBtn.title = text || '点击说话';
}

// ─────────────────────────────────────────────
// Scene rendering
// ─────────────────────────────────────────────

const skyEl = document.querySelector('#sky');
const container = document.querySelector('#scene-content');

function goToScene(id) {
    const data = SCENES[id];
    if (!data) return;

    closeCard();
    clearAllHighlights();
    hideDisambiguationOverlay();

    skyEl.setAttribute('src', data.panorama);
    container.innerHTML = '';

    data.links.forEach(link => {
        const arrow = document.createElement('a-image');
        arrow.setAttribute('src', '#arrow-img');
        arrow.setAttribute('position', link.pos);
        arrow.setAttribute('rotation', link.rot);
        arrow.setAttribute('class', 'clickable nav-arrow');
        arrow.addEventListener('click', () => goToScene(link.target));
        container.appendChild(arrow);
    });

    data.models.forEach(m => {
        const entity = document.createElement('a-entity');
        entity.setAttribute('gltf-model', m.src);
        entity.setAttribute('position', m.pos);
        entity.setAttribute('scale', m.scale);
        entity.setAttribute('id', m.id);
        entity.setAttribute('class', 'clickable');

        entity.addEventListener('click', (event) => {
            // Collect all intersections from the A-Frame raycaster at click time
            const sceneEl = document.querySelector('a-scene');
            const raycaster = sceneEl?.components?.raycaster;
            const intersections = raycaster?.intersectedEls
                ? raycaster.intersections ?? []
                : [{ object: { el: entity }, point: { x: 0, y: 0, z: 0 } }];

            const { ids, positions } = extractHits(intersections);

            // Ensure the clicked model is always included
            if (!ids.includes(m.id)) {
                ids.unshift(m.id);
                const pos = entity.object3D?.position ?? { x: 0, y: 0, z: 0 };
                positions[m.id] = { x: pos.x, y: pos.y, z: pos.z };
            }

            lastHits = ids;
            lastHitPositions = positions;

            console.log('[raycaster] hits:', ids);

            // If STT is not listening, send query with empty text (general info request)
            if (!stt.isListening) {
                wsClient.send(
                    { type: 'query', hits: ids, hitPositions: positions, text: '这是什么？' },
                    visitedPlants
                );
            }
            // If STT is active, the voice result will trigger onVoiceInput with the hits already set
        });

        container.appendChild(entity);
    });
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function slotToText(slot) {
    const map = { medicinal: '药用价值', botanical: '植物学特征', toxicity: '毒性', drought: '耐旱性' };
    return map[slot] ?? slot;
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────

window.onload = () => {
    goToScene('scene-1');
    createMicButton();
};