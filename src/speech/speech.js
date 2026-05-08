import { appendVoiceLog } from '../ui/panels.js';

let speechRecognition = null;
let activeInput = null;
let activeButton = null;
let isListening = false;

export function speak(text) {
  appendVoiceLog(`TTS: ${text}`);
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.speak(utterance);
}

export function initSpeechRecognition({ onTranscript }) {
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionCtor) {
    return null;
  }

  speechRecognition = new SpeechRecognitionCtor();
  speechRecognition.lang = 'en-US';
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  speechRecognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    if (activeInput) activeInput.value = transcript;
    onTranscript(transcript);
  });
  speechRecognition.addEventListener('start', () => setListening(true));
  speechRecognition.addEventListener('end', () => setListening(false));
  speechRecognition.addEventListener('error', () => {
    appendVoiceLog('STT error: recognition failed');
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
  if (speechRecognition) speechRecognition.start();
}

function setListening(nextListening) {
  isListening = nextListening;
  if (!activeButton) return;
  activeButton.classList.toggle('is-listening', nextListening);
  activeButton.setAttribute('aria-pressed', String(nextListening));
  if (!nextListening) activeButton = null;
}
