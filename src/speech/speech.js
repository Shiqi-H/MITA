import { appendConversationTurn } from '../app/state.js';
import { appendVoiceLog } from '../ui/panels.js';

let speechRecognition = null;
let activeInput = null;
let activeButton = null;
let isListening = false;
let receivedResult = false;
let previousPlaceholder = '';
let activeText = '';
let activeUtterance = null;
let narrationStatus = 'idle';
let narrationToken = 0;

const narrationListeners = new Set();

const LISTENING_PLACEHOLDER = 'Listening ...';

// Trigger voice list load early so it's ready before first speak()
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices(), { once: true });
}

export function speak(text) {
  const nextText = String(text ?? '').trim();
  if (!nextText) return;

  appendVoiceLog(`System: ${nextText}`);
  appendConversationTurn(`System: ${nextText}`);
  startNarration(nextText);
}

export function pauseNarration() {
  if (!('speechSynthesis' in window) || narrationStatus !== 'playing') return;
  window.speechSynthesis.pause();
  narrationStatus = 'paused';
  notifyNarrationListeners();
}

export function resumeNarration() {
  if (!('speechSynthesis' in window) || narrationStatus !== 'paused') return;
  window.speechSynthesis.resume();
  narrationStatus = 'playing';
  notifyNarrationListeners();
}

export function stopNarration() {
  if (!activeText && narrationStatus === 'idle') return;
  narrationToken += 1;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
  narrationStatus = activeText ? 'stopped' : 'idle';
  notifyNarrationListeners();
}

export function replayNarration() {
  if (!activeText) return;
  startNarration(activeText);
}

export function subscribeNarration(listener) {
  narrationListeners.add(listener);
  listener(getNarrationState());
  return () => narrationListeners.delete(listener);
}

function startNarration(text) {
  activeText = text;

  if (!('speechSynthesis' in window)) {
    activeUtterance = null;
    narrationStatus = 'unsupported';
    notifyNarrationListeners();
    return;
  }

  narrationToken += 1;
  const token = narrationToken;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(activeText);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  const voice = pickBestVoice();
  if (voice) utterance.voice = voice;
  utterance.addEventListener('start', () => {
    if (token !== narrationToken) return;
    narrationStatus = 'playing';
    notifyNarrationListeners();
  });
  utterance.addEventListener('end', () => {
    if (token !== narrationToken) return;
    activeUtterance = null;
    narrationStatus = 'ended';
    notifyNarrationListeners();
  });
  utterance.addEventListener('error', () => {
    if (token !== narrationToken) return;
    activeUtterance = null;
    narrationStatus = 'ended';
    notifyNarrationListeners();
  });
  activeUtterance = utterance;
  narrationStatus = 'playing';
  notifyNarrationListeners();
  window.speechSynthesis.speak(utterance);
}

function getNarrationState() {
  return {
    status: narrationStatus,
    text: activeText,
    canPause: narrationStatus === 'playing',
    canResume: narrationStatus === 'paused',
    canReplay: Boolean(activeText),
    canStop: narrationStatus === 'playing' || narrationStatus === 'paused',
  };
}

function notifyNarrationListeners() {
  const state = getNarrationState();
  narrationListeners.forEach((listener) => listener(state));
}

function pickBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));

  // Prefer Microsoft natural/neural voices (Windows online voices sound much better)
  const neural = enVoices.find((v) => /aria|jenny|guy|sonia|ryan|natasha|neural|natural/i.test(v.name));
  if (neural) return neural;

  // Next: any online voice
  const online = enVoices.find((v) => v.localService === false);
  if (online) return online;

  // Next: en-US local voice over anything else
  const usLocal = enVoices.find((v) => v.lang === 'en-US');
  if (usLocal) return usLocal;

  return enVoices[0] ?? null;
}

export function initSpeechRecognition({ onRecognitionFailure }) {
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    return null;
  }

  speechRecognition = new SpeechRecognitionCtor();
  speechRecognition.lang = 'en-US';
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  speechRecognition.addEventListener('result', (event) => {
    receivedResult = true;
    const transcript = event.results[0][0].transcript;
    if (activeInput) {
      activeInput.value = transcript;
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      activeInput.focus();
    }
  });
  speechRecognition.addEventListener('start', () => {
    receivedResult = false;
    setListening(true);
  });
  speechRecognition.addEventListener('end', () => {
    if (!receivedResult) onRecognitionFailure?.('no-result');
    setListening(false);
  });
  speechRecognition.addEventListener('error', () => {
    receivedResult = true;
    onRecognitionFailure?.('error');
    setListening(false);
  });
  return speechRecognition;
}

export function startSpeechRecognition(input = null, button = null) {
  if (isListening) {
    speechRecognition?.stop();
    setListening(false);
    return;
  }

  activeInput = input;
  activeButton = button;
  previousPlaceholder = activeInput?.placeholder ?? '';
  if (speechRecognition) speechRecognition.start();
}

function setListening(nextListening) {
  isListening = nextListening;
  if (activeInput) {
    if (nextListening) {
      activeInput.placeholder = LISTENING_PLACEHOLDER;
    } else if (activeInput.placeholder === LISTENING_PLACEHOLDER) {
      activeInput.placeholder = previousPlaceholder;
    }
  }
  if (activeButton) {
    activeButton.classList.toggle('is-listening', nextListening);
    activeButton.setAttribute('aria-pressed', String(nextListening));
  }
  if (!nextListening) {
    activeButton = null;
    activeInput = null;
    previousPlaceholder = '';
  }
}
