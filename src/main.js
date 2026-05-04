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

const skyEl = document.querySelector('#sky');
const container = document.querySelector('#scene-content');

function goToScene(id) {
    const data = SCENES[id];
    if (!data) return;

    skyEl.setAttribute('src', data.panorama);
    container.innerHTML = '';

    data.links.forEach(link => {
        const arrow = document.createElement('a-image');
        arrow.setAttribute('src', '#arrow-img');
        arrow.setAttribute('position', link.pos);
        arrow.setAttribute('rotation', link.rot);
        arrow.setAttribute('class', 'clickable');
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

        entity.addEventListener('click', () => {
            console.log(`Referent model id: ${m.id}`);
            alert(`model name: ${m.name}`);
        });

        container.appendChild(entity);
    });
}

window.onload = () => goToScene('scene-1');