import { appendVoiceLog } from '../ui/panels.js';

let speechRecognition = null;
let activeInput = null;
let activeButton = null;
let isListening = false;
let receivedResult = false;
let previousPlaceholder = '';

const LISTENING_PLACEHOLDER = 'Listening ...';

export function speak(text) {
  appendVoiceLog(`System: ${text}`);
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function initSpeechRecognition({ onTranscript, onRecognitionFailure }) {
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
    if (activeInput) activeInput.value = transcript;
    onTranscript(transcript);
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
    appendVoiceLog('STT error: recognition failed');
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
