const SCENES = {
    'scene-1': {
        title: 'Scene 1',
        panorama: '/scene-1.jpg',
        links: [
            { target: 'scene-2', pos: '1 -1 -3', rot: '-90 -20 0' },
            { target: 'scene-3', pos: '-1 -1 3', rot: '-90 160 0' }
        ],
        models: [
            { id: 'Box', name: 'Tree A', pos: '5 0 -4', scale: '0.5 0.5 0.5' }
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
        const box = document.createElement('a-box');
        box.setAttribute('position', m.pos);
        box.setAttribute('scale', m.scale);
        box.setAttribute('color', 'red');
        box.setAttribute('class', 'clickable');
        box.setAttribute('id', m.id);

        box.addEventListener('click', () => {
            alert(`This is ${m.name}, ready for more info`);
        });
        container.appendChild(box);
    });
}

window.onload = () => goToScene('scene-1');