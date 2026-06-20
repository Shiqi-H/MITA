import {
  pauseNarration,
  replayNarration,
  resumeNarration,
  stopNarration,
  subscribeNarration,
} from '../speech/speech.js';

const ICONS = {
  voice:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4"></path><path d="M8 7v10"></path><path d="M12 4v16"></path><path d="M16 8v8"></path><path d="M20 6v12"></path></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14"></path><path d="M16 5v14"></path></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>',
  collapse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>',
};

const AUTO_HIDE_DELAY_MS = 7000;

let unsubscribe = null;
let hideTimer = null;

export function initAudioBar(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="audio-bar-main">
      <span class="audio-avatar" aria-hidden="true">${ICONS.voice}</span>
      <p class="audio-bar-preview"></p>
      <button class="audio-control" type="button" data-action="toggle" aria-label="Pause narration" title="Pause">
        ${ICONS.pause}
      </button>
      <button class="audio-control" type="button" data-action="transcript" aria-label="Show transcript" aria-expanded="false" title="Show transcript">
        ${ICONS.expand}
      </button>
      <button class="audio-control" type="button" data-action="close" aria-label="Close audio bar" title="Close">
        ${ICONS.close}
      </button>
    </div>
    <div class="audio-transcript" hidden>
      <p></p>
    </div>
  `;

  const toggleButton = container.querySelector('[data-action="toggle"]');
  const transcriptButton = container.querySelector('[data-action="transcript"]');
  const closeButton = container.querySelector('[data-action="close"]');
  const preview = container.querySelector('.audio-bar-preview');
  const transcript = container.querySelector('.audio-transcript');
  const transcriptText = transcript.querySelector('p');

  toggleButton.addEventListener('click', () => {
    if (container.dataset.status === 'paused') {
      resumeNarration();
    } else if (container.dataset.status === 'playing') {
      pauseNarration();
    } else {
      replayNarration();
    }
  });
  transcriptButton.addEventListener('click', () => {
    const nextHidden = !transcript.hidden;
    transcript.hidden = nextHidden;
    container.classList.toggle('is-expanded', !nextHidden);
    transcriptButton.innerHTML = nextHidden ? ICONS.expand : ICONS.collapse;
    transcriptButton.setAttribute('aria-expanded', String(!nextHidden));
    transcriptButton.title = nextHidden ? 'Show transcript' : 'Hide transcript';
  });
  closeButton.addEventListener('click', () => {
    stopNarration();
    transcript.hidden = true;
    container.classList.remove('is-expanded');
    transcriptButton.innerHTML = ICONS.expand;
    transcriptButton.setAttribute('aria-expanded', 'false');
    setAudioBarHidden(container, true);
  });

  unsubscribe?.();
  unsubscribe = subscribeNarration((state) => {
    window.clearTimeout(hideTimer);
    container.dataset.status = state.status;
    preview.textContent = getPreviewText(state);
    transcriptText.textContent = state.text;

    const isPaused = state.status === 'paused';
    const isPlaying = state.status === 'playing';
    toggleButton.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
    toggleButton.setAttribute('aria-label', isPlaying ? 'Pause narration' : 'Start narration');
    toggleButton.title = isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Start';
    toggleButton.disabled = !state.canPause && !state.canResume && !state.canReplay;
    transcriptButton.disabled = !state.text;

    if (!state.text) {
      setAudioBarHidden(container, true);
      transcript.hidden = true;
      container.classList.remove('is-expanded');
      transcriptButton.innerHTML = ICONS.expand;
      transcriptButton.setAttribute('aria-expanded', 'false');
      return;
    }

    setAudioBarHidden(container, false);

    if (state.status === 'ended') {
      hideTimer = window.setTimeout(() => {
        if (container.dataset.status === 'ended' && transcript.hidden) {
          setAudioBarHidden(container, true);
        }
      }, AUTO_HIDE_DELAY_MS);
    }
  });
}

function getPreviewText(state) {
  if (state.status === 'playing') return 'Speaking...';
  if (state.status === 'paused') return 'Speaking...';
  return getLeadingText(state.text);
}

function getLeadingText(text) {
  const cleanText = String(text ?? '').trim();
  const maxLength = 45;
  if (cleanText.length <= maxLength) return cleanText;

  const snippet = cleanText.slice(0, maxLength);
  const lastSpace = snippet.lastIndexOf(' ');
  const preview = lastSpace > 28 ? snippet.slice(0, lastSpace) : snippet;
  return `${preview.trimEnd()}...`;
}

function setAudioBarHidden(container, hidden) {
  container.hidden = hidden;
}
