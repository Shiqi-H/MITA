const SCENES = {
    'scene-1': {
        title: 'Scene 1',
        label: '1',
        panorama: '/scene-1.jpg',
        links: [
            { target: 'scene-2', pos: '1 -1 -3', rot: '-90 -20 0' },
            { target: 'scene-3', pos: '-1 -1 3', rot: '-90 160 0' }
        ],
        models: [
            { 
                id: 'lavender', 
                src: 'models/Lavandula.glb',
                name: 'Lavandula', 
                description: 'A fragrant Mediterranean herb known for violet flowers and aromatic foliage.',
                pos: '3 -1 4',
                scale: '4 4 4'
            },
            {
                id: 'Nephrolepis',
                src: 'models/Nephrolepis.glb',
                name: 'Nephrolepis',
                description: 'A lush fern with arching fronds that adds soft, humid woodland texture.',
                pos: '3 -1 2',
                scale: '4 4 4'
            },
            {
                id: 'Santolina',
                src: 'models/Santolina.glb',
                name: 'Santolina',
                description: 'A compact silver-green shrub often used for aromatic borders and dry gardens.',
                pos: '3 -1 0',
                scale: '4 4 4'
            }
        ]
    },
    'scene-2': {
        title: 'Scene 2',
        label: '2',
        panorama: '/scene-2.jpg',
        links: [
            { target: 'scene-1', pos: '3 -1 -1', rot: '-90 -30 0' },
            { target: 'scene-4', pos: '3 -1 1', rot: '-90 -120 0' }
        ],
        models: []
    },
    'scene-3': {
        title: 'Scene 3',
        label: '3',
        panorama: '/scene-3.jpg',
        links: [
            { target: 'scene-1', pos: '3 -1 0', rot: '-90 -120 0' }
        ],
        models: []
    },
    'scene-4': {
        title: 'Scene 4',
        label: '4',
        panorama: '/scene-4.jpg',
        links: [
            { target: 'scene-2', pos: '3 -1 0', rot: '-90 -120 0' },
            { target: 'scene-5', pos: '3 -1 -2', rot: '-90 -60 0' }
        ],
        models: []
    },
    'scene-5': {
        title: 'Scene 5',
        label: '5',
        panorama: '/scene-5.jpg',
        links: [
            { target: 'scene-4', pos: '-3 -1 -1', rot: '-90 70 0' }
        ],
        models: []
    }
};

const skyEl = document.querySelector('#sky');
const container = document.querySelector('#scene-content');
const sceneTitle = document.querySelector('#scene-title');
const sceneNav = document.querySelector('.scene-nav');
const plantPanel = document.querySelector('.plant-panel');
const plantName = document.querySelector('#plant-name');
const plantDescription = document.querySelector('#plant-description');
const panelClose = document.querySelector('.panel-close');
const loadingIndicator = document.querySelector('.loading-indicator');

let activeSceneId = 'scene-1';
let loadingTimer;

function setLoading(isLoading) {
    window.clearTimeout(loadingTimer);

    if (isLoading) {
        loadingIndicator.classList.add('is-visible');
        return;
    }

    loadingTimer = window.setTimeout(() => {
        loadingIndicator.classList.remove('is-visible');
    }, 250);
}

function updateNav() {
    sceneNav.querySelectorAll('button').forEach(button => {
        button.setAttribute('aria-current', String(button.dataset.scene === activeSceneId));
    });
}

function scaleBy(scale, factor) {
    return scale
        .split(' ')
        .map(value => Number(value) * factor)
        .join(' ');
}

function showPlant(model) {
    plantName.textContent = model.name;
    plantDescription.textContent = model.description;
    plantPanel.hidden = false;
}

function hidePlant() {
    plantPanel.hidden = true;
}

function renderSceneLinks(links) {
    links.forEach(link => {
        const arrow = document.createElement('a-image');
        arrow.setAttribute('src', '#arrow-img');
        arrow.setAttribute('position', link.pos);
        arrow.setAttribute('rotation', link.rot);
        arrow.setAttribute('scale', '0.82 0.82 0.82');
        arrow.setAttribute('class', 'clickable');
        arrow.setAttribute('animation__hover', 'property: scale; startEvents: mouseenter; to: 1 1 1; dur: 160');
        arrow.setAttribute('animation__leave', 'property: scale; startEvents: mouseleave; to: 0.82 0.82 0.82; dur: 160');
        arrow.addEventListener('click', () => goToScene(link.target));
        container.appendChild(arrow);
    });
}

function renderModels(models) {
    models.forEach(model => {
        const entity = document.createElement('a-entity');
        entity.setAttribute('gltf-model', model.src);
        entity.setAttribute('position', model.pos);
        entity.setAttribute('scale', model.scale);
        entity.setAttribute('id', model.id);
        entity.setAttribute('class', 'clickable');
        entity.setAttribute('animation__hover', `property: scale; startEvents: mouseenter; to: ${scaleBy(model.scale, 1.09)}; dur: 180`);
        entity.setAttribute('animation__leave', `property: scale; startEvents: mouseleave; to: ${model.scale}; dur: 180`);

        entity.addEventListener('click', () => showPlant(model));
        container.appendChild(entity);
    });
}

function goToScene(id) {
    const data = SCENES[id];
    if (!data) return;

    activeSceneId = id;
    setLoading(true);
    hidePlant();
    sceneTitle.textContent = data.title;
    skyEl.setAttribute('src', data.panorama);
    container.innerHTML = '';
    updateNav();

    renderSceneLinks(data.links);
    renderModels(data.models);
    setLoading(false);
}

function buildSceneNav() {
    Object.entries(SCENES).forEach(([id, scene]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.scene = id;
        button.textContent = scene.label;
        button.setAttribute('aria-label', `Go to ${scene.title}`);
        button.addEventListener('click', () => goToScene(id));
        sceneNav.appendChild(button);
    });
}

panelClose.addEventListener('click', hidePlant);
buildSceneNav();
goToScene(activeSceneId);
